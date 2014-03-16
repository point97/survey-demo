function basicSurveyReportCtrl($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    function survey_use(charts, start_date, end_date, slug) {
        var url = "/report/distribution/" + $routeParams.surveySlug + "/use-surveys";
        return $http.get(url).success(function(data) {
            var total_answers = _.reduce(data.answer_domain, function(accum, val) {
                return accum + val.surveys;
            }, 0);

            charts.push({
                title: "Respondants Reporting Survey Use",
                type: "column",
                displayTitle: false,
                labels: _.map(data.answer_domain, function(x) { return x.answer; }),
                data: _.map(data.answer_domain, function(x) { return x.surveys; }),
                categories: [""],
                download_url: url.replace("harvested", "harvested" + '.csv'),
                xLabel: 'Yes/No',
                yLabel: 'Answers',
                order: 3,
                message: data.message,
                formatter: function() {
                    return '<b>' + this.series.name + '</b>: ' + this.y + "/" + total_answers +
                        ", " + ((this.y/total_answers)*100).toFixed(0) + "%";
                },
                unit: ''
            });
            charts.sort(function (a,b) { return a-b;})
        });
    }

    function collected_methods(charts, start_date, end_date, slug) {
        var url = "/report/distribution/" + $routeParams.surveySlug + "/collection-methods";
        var whitelist = [ "paper", "mailed", "telephone", "in-person", "laptop",
            "online", "mobile"];

        return $http.get(url).success(function(data) {
            var total_answers = _.reduce(data.answer_domain, function(accum, val) {
                return accum + val.surveys;
            }, 0);

            var filtered = _.filter(data.answer_domain, function(x) {
                return whitelist.indexOf(x.answer_text) != -1;
            });

            charts.push({
                title: "Reported Collection Methods",
                type: "column",
                displayTitle: false,
                labels: _.map(filtered, function(x) { return x.answer_text; }),
                data: _.map(filtered, function(x) { return x.surveys; }),
                categories: [""],
                xLabel: 'Collection Method',
                yLabel: 'Answers',
                order: 3,
                message: data.message,
                formatter: function() {
                    return '<b>' + this.series.name + '</b>: ' + this.y + "/" + total_answers +
                        ", " + ((this.y/total_answers)*100).toFixed(0) + "%";
                },
                unit: ''
            });
            charts.sort(function (a,b) { return a-b;})
        });
    }
    function reported_purpose(charts, start_date, end_date, slug) {
        var url = "/report/distribution/" + $routeParams.surveySlug + "/survey-purpose";
        var whitelist = [
            "assessment",
            "decision making",
            "market research",
            "statistical analysis",
            "performance improvement"
        ];

        return $http.get(url).success(function(data) {
            var total_answers = _.reduce(data.answer_domain, function(accum, val) {
                return accum + val.surveys;
            }, 0);

            var filtered = _.filter(data.answer_domain, function(x) {
                return whitelist.indexOf(x.answer_text) != -1;
            });

            charts.push({
                title: "Reported Survey Purposes",
                type: "column",
                displayTitle: false,
                labels: _.map(filtered, function(x) { return x.answer_text; }),
                data: _.map(filtered, function(x) { return x.surveys; }),
                categories: [""],
                xLabel: 'Reported Purpose',
                yLabel: 'Answers',
                order: 3,
                message: data.message,
                formatter: function() {
                    return '<b>' + this.series.name + '</b>: ' + this.y + "/" + total_answers +
                        ", " + ((this.y/total_answers)*100).toFixed(0) + "%";
                },
                unit: ''
            });
            charts.sort(function (a,b) { return a-b;})
        });
    }
    function filters_changed(surveySlug) {
        $scope.charts = [];
        $scope.getRespondents();
        $scope.extra_stuff = {
            'group': $scope.surveyorTimeFilter,
            //'extra_dropdown': $scope.extra_dropdown,
            'status': $scope.status_single,
        }

        var start_date = new Date($scope.filter.startDate).toString('yyyyMMdd');
        var end_date = new Date($scope.filter.endDate).day().toString('yyyyMMdd');

        survey_use($scope.charts, start_date, end_date, surveySlug);
        collected_methods($scope.charts, start_date, end_date, surveySlug);
        reported_purpose($scope.charts, start_date, end_date, surveySlug);

        // Since this controller is associated with a survey at the database 
        // level we can just use the slug. Genius!
        var url = "/report/distribution/" + $routeParams.surveySlug + "/fishing-area";
    }

    //$scope.market = $location.search().survey_site || null;
    $scope.surveyorTimeFilter = 'week';
    $scope.filter = null;
    $scope.charts = [];
    $scope.sectioned_charts = {};
    $scope.viewPath = app.viewPath;
    $scope.surveyorTimeFilter = 'week';
    $scope.activePage = $routeParams.subpageSlug;
    $scope.statuses = [];
    $scope.status_single = $location.search().status || null;
    //$scope.extra_dropdown_text = "All Species";
    $scope.map = {
        center: {
            lat: 45.382076,
            lng: -123.8025571
        },
        marker: {},
        zoom: 9,
        msg: null
    };

    surveyShared.getSurvey(function(data) {
        data.questions.reverse();
        $scope.survey = data;
        reportsCommon.setup_arbitrary_dropdown($scope, "dive-species");
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
