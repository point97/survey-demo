from tastypie.resources import ModelResource, ALL, ALL_WITH_RELATIONS
from tastypie import fields, utils

from tastypie.authentication import SessionAuthentication
from tastypie.authorization import DjangoAuthorization
from django.conf.urls.defaults import url

from survey.models import Survey, Question, Option, Respondant, Response #, Page

# class PageResource(ModelResource):
#     question = fields.ToOneField('apps.survey.api.QuestionResource', 'question', full=True)
#     survey = fields.ToOneField('apps.survey.api.SurveyResource', 'question')
#     class Meta:
#         queryset = Page.objects.all()
#         ordering = ['order']


class ResponseResource(ModelResource):
    question = fields.ToOneField('apps.survey.api.QuestionResource', 'question', full=True)

    class Meta:
        queryset = Response.objects.all().order_by('question__order');

class RespondantResource(ModelResource):
    responses = fields.ToManyField(ResponseResource, 'responses', full=True)

    class Meta:
        queryset = Respondant.objects.all()
        authentication = SessionAuthentication()
        authorization = DjangoAuthorization()

class OptionResource(ModelResource):
    class Meta:
        queryset = Option.objects.all()


class QuestionResource(ModelResource):
    options = fields.ToManyField(OptionResource, 'options', full=True)
    modalQuestion = fields.ToOneField('self', 'modalQuestion', full=True, null=True, blank=True)
    hoist_answers = fields.ToOneField('self', 'hoist_answers', full=True, null=True, blank=True)

    class Meta:
        queryset = Question.objects.all().order_by('order');



class SurveyResource(ModelResource):
    questions = fields.ToManyField(QuestionResource, 'questions', full=True)

    class Meta:
        queryset = Survey.objects.all()

    def prepend_urls(self):
        return [
            url(r"^(?P<resource_name>%s)/(?P<slug>[\w\d_.-]+)/$" % self._meta.resource_name, self.wrap_view('dispatch_detail'), name="api_dispatch_detail"),
        ]