function logbookPassengerFishingCtrl($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    function number_caught_by_species(charts, start_date, end_date, slug) {
        var url = reportsCommon.build_crosstab_url(start_date, end_date, slug, 'passenger-catch-number', 'passenger-catch-species', $scope.extra_stuff);
        return $http.get(url).success(function(data) {
            var bar_data = {};
            _.each(data.crosstab, function (x) {
                _.each(x.value, function (y) {
                    if (typeof(bar_data[y.row_text]) == 'undefined') {
                        bar_data[y.row_text] = parseInt(y.average);
                    } else {
                        bar_data[y.row_text] += parseInt(y.average);
                    }
                });
            });

            charts.push({
                title: "Pounds Caught by Species",
                type: "column",
                displayTitle: false,
                labels: _.keys(bar_data),
                data: _.values(bar_data),
                categories: [""],
                download_url: url.replace("species", "species" + '.csv'),
                xLabel: 'Species',
                yLabel: 'Number',
                order: 3,
                message: data.message,
                unit: 'kg'
            });
            charts.sort(function (a,b) { return a-b;})
        });
    }
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

    function number_caught_by_depth(charts, start_date, end_date, slug) {
        var url = reportsCommon.build_crosstab_url(start_date, end_date, slug, 'cpfv-water-depth', 'passenger-catch-number', $scope.extra_stuff);
        return $http.get(url).success(function(data) {
            labels = {};
            _.each(data.crosstab, function(iter, val) {
                _.each(iter.value, function(iter2, val2) {
                    if (typeof(labels[iter2.row_text]) == 'undefined') {
                        labels[iter2.row_text] = [];
                    }
                    labels[iter2.row_text].push(iter2.average);
                });
            });
            to_graph = _.map(_.keys(labels), function(item) {
                return {
                    name: item,
                    data: labels[item]
                }
            });

            charts.push({
                title: "Number Caught by Depth",
                type: "time-series",
                labels: _.keys(to_graph),
                seriesNames: _.keys(to_graph),
                download_url: url.replace('number', 'number.csv'),
                raw_data: _.values(to_graph),
                tooltipFormatter: function() {
                    return '<b>' + this.series.name + '</b>' + ': ' + this.y;
                },
                categories: _.map(data.crosstab, function(item) { return item.name}),
                xLabel: 'Depth',
                yLabel: 'Number',
                xaxis_type: 'category',
                xaxis_formatter: function() { return "<b>" + this.value + "</b>"; },
                order: 1,
                message: data.message
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

        number_caught_by_species($scope.charts, start_date, end_date, surveySlug);
        number_caught_by_depth($scope.charts, start_date, end_date, surveySlug);

        // Since this controller is associated with a survey at the database 
        // level we can just use the slug. Genius!
        var url = "/report/distribution/" + $routeParams.surveySlug + "/fishing-area";
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
    $scope.extra_dropdown_text = "All Species";
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
        reportsCommon.setup_arbitrary_dropdown($scope, "passenger-catch-species");
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
