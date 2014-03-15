from django import template
from django.conf import settings
from django.core.urlresolvers import reverse

from survey.models import Survey

register = template.Library()

@register.simple_tag
def get_survey_link(domain, survey_slug):
    # TODO: Use the django sites framework in here
    # http://demo.pointnineseven.com/static/survey/mobile.html#/survey/fish-market-survey/online
    # {% get_survey_link "http://demo.pointnineseven.com" "fish-market-survey" %}
    return "{0}{1}survey/mobile.html#/survey/{2}/online".format(domain, settings.STATIC_URL, survey_slug)
