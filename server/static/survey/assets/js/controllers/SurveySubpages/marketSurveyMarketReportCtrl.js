function marketSurveyMarketReportCtrl($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    function fish_weight_by_market(charts, start_date, end_date, slug) {
        var url = reportsCommon.build_crosstab_url(start_date, end_date, slug, 'market-surveyed', 'sale-pounds', $scope.extra_stuff);
        return $http.get(url).success(function(data) {
            var sdate = new Date($scope.filter.startDate);
            var edate = new Date($scope.filter.endDate);

            var filtered = _.map(data.crosstab, function(answer) {
                answer.value = _.filter(answer.value, function(x) {
                    var d = reportsCommon.dateFromISO(x.date);
                    return (d >= sdate && d <= edate);
                });
                return answer;
            });

            charts.push({
                title: "Total Fish Weight Over Time",
                type: data.type,
                displayTitle: false,
                labels: _.pluck(filtered, 'name'),
                data: filtered,
                download_url: url.replace("total-weight", "total-weight.csv"),
                xLabel: 'Market',
                yLabel: 'Weight (kg)',
                order: 2,
                message: data.message,
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
            'market': $scope.market,
            'status': $scope.status_single,
        }

        var start_date = new Date($scope.filter.startDate).toString('yyyyMMdd');
        var end_date = new Date($scope.filter.endDate).day().toString('yyyyMMdd');

        fish_weight_by_market($scope.charts, start_date, end_date, surveySlug);
    }

    $scope.market = $location.search().survey_site || null;
    $scope.surveyorTimeFilter = 'week';
    $scope.filter = null;
    $scope.charts = [];
    $scope.sectioned_charts = {};
    $scope.viewPath = app.viewPath;
    $scope.surveyorTimeFilter = 'week';
    $scope.activePage = $routeParams.subpageSlug;
    $scope.statuses = [];
    $scope.status_single = $location.search().status || null;

    surveyShared.getSurvey(function(data) {
        data.questions.reverse();
        $scope.survey = data;
        reportsCommon.setup_market_dropdown($scope);
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

    $scope.$watch('market', function (newValue) {
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