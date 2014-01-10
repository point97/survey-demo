import calendar
import json
from collections import defaultdict

from django.http.response import (HttpResponse, HttpResponseBadRequest,
                                  HttpResponseForbidden)
from django.db.models import Avg, Count, Min, Max, Sum
from django.views.generic.base import View

from ordereddict import OrderedDict

from apps.survey.models import GridAnswer, Question, Response

from .forms import APIFilterForm, GridStandardDeviationForm
from .utils import CustomJSONEncoder, SlugCSVWriter


class BaseGraphView(View):
    output = None

    def dispatch(self, request, **kwargs):
        renderer = getattr(self, 'render_to_{0}'.format(self.output), None)
        if renderer is None:
            return HttpResponseBadRequest()
        if (not request.user.is_authenticated() or
                not (request.user.is_staff or request.user.is_superuser)):
            return HttpResponseForbidden()
        self.form = self.form_class(request.GET)
        if not self.form.is_valid():
            return self.error(self.form.errors)

        self.rows, self.meta = self.get_rows(form_data=self.form.cleaned_data,
                                             **kwargs)
        self.filename = self.filename_template.format(**kwargs)
        return renderer()

    def build_filter(self, form_data):
        filters = {}
        for key, value in form_data.iteritems():
            if value is not None:
                filters[self.model_filter[key]] = value
        return filters

    def get_rows(self):
        raise NotImplementedError

    def process_data_for_json(self):
        pass

    def render_to_json(self):
        self.process_data_for_json()
        return HttpResponse(json.dumps({
            'success': True,
            'graph_data': self.rows,
            'meta': self.meta,
        }, cls=CustomJSONEncoder), content_type='application/json')

    def process_data_for_csv(self):
        pass

    def render_to_csv(self):
        self.process_data_for_csv()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = ('attachment; filename="{0}"'
                                           .format(self.csv_filename))
        writer = SlugCSVWriter(response, self.field_names)
        writer.writeheader()
        writer.writerows(self.rows)
        return response


class GridStandardDeviationView(BaseGraphView):
    form_class = GridStandardDeviationForm
    model_filter = {
        'row': 'row_label',
        'col': 'col_label',
        'market': 'response__respondant__survey_site',
        'status': 'response__respondant__review_status',
        'start_date': 'response__respondant__ts__gte',
        'end_date': 'response__respondant__ts__lt'
    }
    field_names = OrderedDict((
        ('row_text', 'Type'),
        ('date', 'Date'),
        ('minimum', 'Minimum'),
        ('average', 'Average'),
        ('maximum', 'Maximum'),
        ('total', 'Total')
    ))
    filename_template = 'grid_standard_deviation_{question_slug}_{interval}.csv'

    def get_rows(self, question_slug, interval, form_data):
        rows = (GridAnswer.objects.filter(response__question__slug=question_slug)
                                  .extra(select={'date': "date_trunc(%s, survey_response.ts)"},
                                         select_params=(interval,),
                                         tables=('survey_response',))
                                  .filter(**self.build_filter(form_data)))

        labels = list(rows.values_list('row_label', flat=True).distinct())
        rows = (rows.values('row_text', 'row_label', 'date')
                    .order_by('date')
                    .annotate(minimum=Min('answer_number'),
                              average=Avg('answer_number'),
                              maximum=Max('answer_number'),
                              total=Sum('answer_number')))
        return rows, {'labels': list(labels)}

    def process_data_for_json(self):
        graph_data = defaultdict(list)
        for row in self.rows:
            row['date'] = calendar.timegm(row['date'].utctimetuple()) * 1000
            graph_data[row['row_text']].append(row)
        self.rows = graph_data

    def process_data_for_csv(self):
        for row in self.rows:
            row.pop('row_label')
            row['date'] = str(row['date'])


class SingleSelectCountView(BaseGraphView):
    form = APIFilterForm
    model_filter = {
        'market': 'respondant__survey_site',
        'status': 'respondant__review_status',
        'start_date': 'respondant__ts__gte',
        'end_date': 'respondant__ts__lt'
    }
    field_names = OrderedDict((
        ('answer', None),
        ('count', 'Count')
    ))
    filename_template = 'single_select_{question_slug}.csv'

    def get_rows(self, question_slug, form_data):
        question = Question.objects.get(slug=question_slug)
        rows = Response.objects.filter(question=question,
                                       **self.build_filter(form_data))
        labels = None
        if question.rows:
            labels = question.rows.splitlines()
            rows = rows.filter(answer__in=labels)

        if labels is None:
            labels = rows.distinct().values_list('answer', flat=True)

        rows = (rows.values('answer')
                    .annotate(count=Count('answer')))
        return rows, {'labels': list(labels)}
