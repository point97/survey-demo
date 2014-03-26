function marketSurveyMarketReportCtrl($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    function price_by_date(charts, start_date, end_date, slug) {
        var url = reportsCommon.build_crosstab_url(start_date, end_date, slug, 'date-surveyed', 'fish-price-pound', $scope.extra_stuff);
        return $http.get(url).success(function(data) {
            labels = {};
            _.each(data.crosstab, function(iter, val) {
                _.each(iter.value, function(iter2, val2) {
                    if (typeof(labels[iter2.row_text]) == 'undefined') {
                        labels[iter2.row_text] = [];
                    }
                    // TODO: This is probably pretty fragile.
                    var conv_date = reportsCommon.dateFromISO(new Date(iter.name.split("/").reverse()));
                    var timestamp = Date.UTC(conv_date.getYear() + 1900, conv_date.getMonth(), conv_date.getDay());
                    if (isNaN(timestamp))
                        debugger;
                    labels[iter2.row_text].push([timestamp, iter2.average]);
                    labels[iter2.row_text].sort();
                });
            });
            to_graph = _.map(_.keys(labels), function(item) {
                return {
                    name: item,
                    data: labels[item]
                }
            });

            charts.push({
                title: "Average Price by Date",
                type: "time-series",
                labels: _.map(to_graph, function(x) { return x.name; }),
                seriesNames: _.map(to_graph, function(x) { return x.name; }),
                download_url: url.replace('fish-price-pound', 'fish-price-pound.csv'),
                raw_data: to_graph,
                tooltipFormatter: function() {
                    return '<b>' + this.series.name + '</b>' + ': ' + this.y + " lbs";
                },
                xLabel: 'Depth',
                yLabel: 'Pounds',
                order: 1,
                message: data.message
            });
            charts.sort(function (a,b) { return a-b;})
        });
    }
    function fish_weight_by_market(charts, start_date, end_date, slug) {
        var url = reportsCommon.build_crosstab_url(start_date, end_date, slug, 'market-surveyed', 'sale-pounds', $scope.extra_stuff);
        return $http.get(url).success(function(data) {

            charts.push({
                title: "Pounds of Fish by Market",
                type: data.type,
                displayTitle: false,
                labels: _.pluck(data.crosstab, 'name'),
                data: data.crosstab,
                download_url: url.replace("sale-pounds", "sale-pounds.csv"),
                xLabel: 'Market',
                yLabel: 'Weight (lbs)',
                order: 2,
                message: data.message,
                seriesNames: data.seriesNames,
                unit: 'kg'
            });
            charts.sort(function (a,b) { return a-b;})
        });
    }

    function filters_changed(surveySlug) {
        $scope.charts = [];
        $scope.getRespondents();
        $scope.extra_stuff = {
            'group': $scope.surveyorTimeFilter,
            'extra_dropdown': $scope.extra_dropdown,
            'status': $scope.status_single,
        }

        var start_date = new Date($scope.filter.startDate).toString('yyyyMMdd');
        var end_date = new Date($scope.filter.endDate).day().toString('yyyyMMdd');

        fish_weight_by_market($scope.charts, start_date, end_date, surveySlug);
        price_by_date($scope.charts, start_date, end_date, surveySlug);
    }

    $scope.market = $location.search().survey_site || null;
    $scope.has_date = true;
    $scope.surveyorTimeFilter = 'week';
    $scope.filter = null;
    $scope.charts = [];
    $scope.sectioned_charts = {};
    $scope.viewPath = app.viewPath;
    $scope.surveyorTimeFilter = 'week';
    $scope.activePage = $routeParams.subpageSlug;
    $scope.statuses = [];
    $scope.status_single = $location.search().status || null;
    $scope.extra_dropdown_text = "All Species";

    surveyShared.getSurvey(function(data) {
        data.questions.reverse();
        $scope.survey = data;
        reportsCommon.setup_arbitrary_dropdown($scope, "fish-types");
        var start_date = $location.search().ts__gte ?
            new Date(parseInt($location.search().ts__gte, 10)) :
            reportsCommon.dateFromISO($scope.survey.response_date_start);
        var end_date = $location.search().ts__lte ?
            new Date(parseInt($location.search().ts__lte, 10)) :
            reportsCommon.dateFromISO($scope.survey.response_date_end);
        $scope.filter = {
            min: reportsCommon.dateFromISO($scope.survey.response_date_start).valueOf(),
            max: reportsCommon.dateFromISO($scope.survey.response_date_end).valueOf(),
            startDate: start_date.valueOf(),
            endDate: end_date.valueOf()
        }
    });

    $scope.getRespondents = function(url) {
        // Higher order function to make the next/prve buttons work.
        return reportsCommon.getRespondents(url, $scope);
    }

    $scope.$watch('filter', function (newValue) {
        if (newValue) {
            filters_changed($routeParams.surveySlug);
        }
    }, true);

    $scope.$watch('status_single', function (newValue) {
        if ($scope.filter) {
            filters_changed($routeParams.surveySlug);
        }
    }, false);

    $scope.$watch('extra_dropdown', function (newValue) {
        if ($scope.filter) {
            filters_changed($routeParams.surveySlug);
        }
    }, true);

    $scope.$watch('surveyorTimeFilter', function (newValue) {
        if ($scope.filter) {
            filters_changed($routeParams.surveySlug);
        }
    }, true);
}
