from django import forms
from registration.forms import RegistrationForm
from django.contrib.auth.models import User

class Email(forms.EmailField): 
    def clean(self, value):
        super(Email, self).clean(value)
        if User.objects.filter(email=value).exists():
            raise forms.ValidationError("Email address already registed. <a href=\"/admin/password_reset/\">Forgot password?</a>")
        return value


class UserRegistrationForm(forms.Form):
    password1 = forms.CharField(widget=forms.PasswordInput(), label="Password", required=True)
    password2 = forms.CharField(widget=forms.PasswordInput(), label="Repeat your password", required=True)
    #email will be become username
    email = Email()

    def clean_password(self):
        if self.data['password1'] != self.data['password2']:
            raise forms.ValidationError('Passwords are not the same')
        return self.data['password1']
