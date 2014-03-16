function logbookDiveCtrl($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    function build_map(url) {
        $http.get(url).success(function(data) {
            $scope.locations = _.map(data.answer_domain, function(x) {
                var assoc_respondant = _.find($scope.respondents, function(y) {
                    return x.location__response__respondant == y.uuid;
                });

                if (typeof assoc_respondant == 'undefined')
                    return null;

                var loc_data = {
                    visibility: true,
                    lat: parseFloat(x.location__lat),
                    lng: parseFloat(x.location__lng),
                    icon: 'crosshair_white.png',
                    date: x.location__response__ts,
                    respondant_url:  reportsCommon.build_url_for_respondant($scope, assoc_respondant),
                    respondant: assoc_respondant
                };

                if($routeParams.surveySlug == "fishers-market-survey") {
                    loc_data.catch_load = 25;
                }

                return loc_data;
            });

            $scope.locations = _.filter($scope.locations, function(whatever) {
                return whatever != null;
            });
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

        // Since this controller is associated with a survey at the database 
        // level we can just use the slug. Genius!
        var url = "/report/distribution/" + $routeParams.surveySlug + "/catch-location";
        var promise = reportsCommon.getRespondents(null, $scope);
        promise.success(function() {
            build_map(url);
        });
    }

    //$scope.market = $location.search().survey_site || null;
    $scope.surveyorTimeFilter = 'week';
    $scope.has_map = true;
    $scope.filter = null;
    $scope.charts = [];
    $scope.sectioned_charts = {};
    $scope.viewPath = app.viewPath;
    $scope.surveyorTimeFilter = 'week';
    $scope.activePage = $routeParams.subpageSlug;
    $scope.statuses = [];
    $scope.status_single = $location.search().status || null;
    $scope.map = {
        center: {
            lat: -17.4624892,
            lng: 179.2583049
        },
        marker: {},
        zoom: 8,
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
