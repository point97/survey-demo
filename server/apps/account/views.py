from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import MultipleObjectsReturned
from django.contrib.auth.forms import PasswordResetForm
from django.conf import settings
from django.contrib.sites.models import RequestSite, Site
from django.template.loader import render_to_string

from registration.models import RegistrationProfile
from registration.backends.default.views import RegistrationView
from registration import signals

from apps.account.forms import UserRegistrationForm
import simplejson


class CustomRegistrationView(RegistrationView):
    form_class = UserRegistrationForm

    def register(self, request, **kwargs):
        email, password = kwargs['email'], kwargs['password1']
        username = email

        new_user = User.objects.create(username=username, email=email)
        new_user.set_password(password)
        new_user.save()

        signals.user_registered.send(sender=self.__class__,
                                     user=new_user,
                                     request=request)

        # Authenticate and log the user in
        new_user = authenticate(username=username, password=password)
        login(request, new_user)

        # TODO: This was ripped out of the dark heart of django-registration. We
        # can't go back, not after what we've done.
        subject = render_to_string('registration/activation_email_subject.txt',
                                   {})
        # Email subject *must not* contain newlines
        subject = ''.join(subject.splitlines())

        message = render_to_string('registration/activation_email.txt',
                                   {})

        # Send them an email
        new_user.email_user(subject, message, settings.DEFAULT_FROM_EMAIL)
        return new_user

    #def get_success_url(self, request, user):
    #    return ('dashboard', (), {})

@csrf_exempt
def authenticateUser(request):
    if request.POST:
        param = simplejson.loads(request.POST.keys()[0])
        # user = User.objects.get(username=param.get('username', None))
        user = authenticate(username=param.get('username', None),
                            password=param.get('password'))
        try:
            login(request, user)
        except:
            return HttpResponse("auth-error", status=500)

        if user:
            user_dict = {
                'username': user.username,
                'name': ' '.join([user.first_name, user.last_name]),
                'is_staff': user.is_staff,
                'api_key': user.api_key.key
            }
            return HttpResponse(simplejson.dumps({
                'success': True, 'user': user_dict
            }))
        else:
            return HttpResponse(simplejson.dumps({'success': False}))
    else:
        return HttpResponse("error", status=500)


@csrf_exempt
def createUser(request):
    if request.POST:
        param = simplejson.loads(request.POST.keys()[0])
        user, created = User.objects.get_or_create(
            username=param.get('username', None))
        if created:
            if param.get('password1') == param.get('password2'):
                user.set_password(param.get('password1'))
                user.save()
                user = authenticate(
                    username=user.username, password=param.get('password1'))
                login(request, user)
                user_dict = {
                    'username': user.username,
                    'name': ' '.join([user.first_name, user.last_name]),
                    'is_staff': user.is_staff,
                    'api_key': user.api_key.key
                }
                return HttpResponse(simplejson.dumps({'success': True, 'user': user_dict}))
        else:
            return HttpResponse("duplicate-user", status=500)
    else:
        return HttpResponse("error", status=500)


@csrf_exempt
def forgotPassword(request):
    if request.POST:
        param = simplejson.loads(request.POST.keys()[0])
        email = param.get('email', None)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return HttpResponse("user-not-found", status=500)
        except MultipleObjectsReturned:
            return HttpResponse("multiple-users-found", status=500)
        print email
        form = PasswordResetForm({'email': email})
        setattr(form, 'users_cache', [user])
        form.save(from_email=settings.SERVER_ADMIN,
            email_template_name='registration/password_reset_email.html')
        return HttpResponse(simplejson.dumps({'success': True}))
    else:
        return HttpResponse("error", status=500)
