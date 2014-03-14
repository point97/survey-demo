from django.conf.urls import patterns
from django.conf.urls import include
from django.conf.urls import url
from django.views.generic.base import TemplateView

    #(r'^accounts/', include('registration.backends.default.urls')),
from registration.backends.default.urls import urlpatterns
from apps.account.views import CustomRegistrationView

urlpatterns += patterns('',
        url(r'^register/$', CustomRegistrationView.as_view(), name='registration_register'),
    )
