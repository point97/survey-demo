from django.conf.urls import patterns, url
from reports.views import (full_data_dump_csv, get_crosstab_json,
                           get_crosstab_csv, get_distribution, get_geojson)
from reports.new_views import (GridStandardDeviationView,
                               SingleSelectCountView,
                               SurveyorStatsView)


urlpatterns = patterns('',
    (r'/distribution/(?P<survey_slug>[\w\d-]+)/(?P<question_slug>[\w\d-]+)', get_distribution),
    (r'/crosstab/(?P<survey_slug>[\w\d-]+)/(?P<question_a_slug>[\w\d-]+)/(?P<question_b_slug>[\w\d-]+).csv', get_crosstab_csv),
    (r'/crosstab/(?P<survey_slug>[\w\d-]+)/(?P<question_a_slug>[\w\d-]+)/(?P<question_b_slug>[\w\d-]+)', get_crosstab_json),
    (r'/geojson/(?P<survey_slug>[\w\d-]+)/(?P<question_slug>[\w\d-]+)', get_geojson),

    url(r'/surveyor-stats/(?P<survey_slug>[\w\d-]+).csv',
        SurveyorStatsView.as_view(output='raw_csv'),
        name='reports_surveyor_stats_raw_data_csv'),

    url(r'/surveyor-stats/(?P<survey_slug>[\w\d-]+)/(?P<interval>[\w]+).csv',
        SurveyorStatsView.as_view(output='csv'),
        name='reports_surveyor_stats_csv'),

    url(r'/surveyor-stats/(?P<survey_slug>[\w\d-]+)/(?P<interval>[\w]+)',
        SurveyorStatsView.as_view(output='json'),
        name='reports_surveyor_stats_json'),

    url(r'/grid-standard-deviation/(?P<question_slug>[\w\d-]+)/(?P<interval>[\w]+).csv',
        GridStandardDeviationView.as_view(output='csv'),
        name='reports_grid_standard_deviation_csv'),

    url(r'/grid-standard-deviation/(?P<question_slug>[\w\d-]+)/(?P<interval>[\w]+)',
        GridStandardDeviationView.as_view(output='json'),
        name='reports_grid_standard_deviation_json'),

    url(r'/single-select-count/(?P<question_slug>[\w\d-]+).csv',
        SingleSelectCountView.as_view(output='csv'),
        name='single_select_count_csv'),

    url(r'/single-select-count/(?P<question_slug>[\w\d-]+)',
        SingleSelectCountView.as_view(output='json'),
        name='single_select_count_json'),

    url(r'/full-survey-data/(?P<survey_slug>[\w\d-]+)',
        full_data_dump_csv,
        name='reports_full_data_dump_csv'),
)
