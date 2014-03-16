//'use strict';

angular.module('askApp')
    .controller('RespondantListCtrl', function($scope, $rootScope, $http, $routeParams, $location, reportsCommon, surveyShared) {

    function build_survey_total_data(data) {
        var new_data = {};
        for (var i in data.graph_data) {
            for (var j in data.graph_data[i].data) {
                var current_date = data.graph_data[i].data[j][0];
                var surveys_taken = data.graph_data[i].data[j][1];
                if (!new_data[current_date]) {
                    new_data[current_date] = {
                        name: current_date,
                        data: surveys_taken
                    }
                } else {
                    new_data[current_date].data += surveys_taken;
                }
            }
        }
        var tuples = _.map(new_data, function(x) { return [parseInt(x.name), x.data]; }).sort();
        return [
            {
                name: "Surveys Taken",
                data: tuples
            }
        ];
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
                    respondant_url:  reportsCommon.build_url_for_respondant(assoc_respondant),
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
        var promise = reportsCommon.getRespondents(null, $scope);
        var url = null;
        // TODO: Put this in the database.
        if ($routeParams.surveySlug == 'fish-market-survey') {
            url = "/report/distribution/" + $routeParams.surveySlug + "/catch-location";
        } else if ($routeParams.surveySlug == 'general-applicationmulti-use-survey') {
            url = "/report/distribution/" + $routeParams.surveySlug + "/survey-location";
        } else if ($routeParams.surveySlug == 'fishers-logbook') {
            url = "/report/distribution/" + $routeParams.surveySlug + "/fishing-area";
        }

        if (url) {
            promise.success(function() {
                build_map(url);
            });
        }

        var survey_stats_url = reportsCommon.build_survey_stats_url($scope);
        $http.get(survey_stats_url).success(function(data) {
            var new_data = build_survey_total_data(data);
            $scope.surveyor_by_time = {
                yLabel: "Survey Responses",
                raw_data: data.graph_data,
                download_url: url.replace($scope.surveyorTimeFilter, $scope.surveyorTimeFilter + '.csv'),
                unit: "surveys"
            }
            // map reduuuuuuce
            var bar_data = _.map(data.graph_data,
                function (x) {
                    return _.reduce(x.data, function (attr, val) { return attr + val[1]; }, 0);
                }
            );
        });
    }

    function setup_columns() {
        //$scope.columns = [ { name: 'Surveyor', field: 'user' }
        //                 , { name: 'Date', field: 'ts' }
        //                 , { name: 'Time', field: 'ts' }
        //                 , { name: 'Status', field: 'review_status' }
        //                 ];
        $scope.columns = _.map($scope.survey.respondant_list_columns, function(x) {
            return { name: x.column_name, field: x.field_name.replace("-", "_") };
        });
        var order_by = $location.search().order_by;

        if (order_by) {
            $scope.sortDescending = order_by[0] == "-";
            $scope.currentColumn = $scope.sortDescending ?
                _.find($scope.columns, function (x) { return "-" + x.field == order_by; }) || $scope.columns[1] :
                _.find($scope.columns, function (x) { return x.field == order_by; }) || $scope.columns[1];
        } else {
            $scope.sortDescending = true;
            var found = _.find($scope.columns, function(x) { return x.name.toLowerCase() == 'time'; });;
            $scope.currentColumn = typeof(found) != 'undefined' ? found : $scope.columns[0];
        }

        $scope.changeSorting = function (column) {
            if ($scope.currentColumn == column) {
                $scope.sortDescending = !$scope.sortDescending;
            } else {
                $scope.currentColumn = column;
                $scope.sortDescending = true;
            }
            reportsCommon.getRespondents(null, $scope);
        };
    }

    $scope.goToResponse = function(respondant) {
        window.location = reportsCommon.build_url_for_respondant($scope, respondant);
    }

    // BLACK MAGIC
    $scope.getSubpages = function() {
        // Synchronously get the name of the controller form the database
        $.ajax({
            async: false,
            url: "/api/v1/surveysubpage/?format=json"
        }).success(function(data) {
            var objects = data['objects'];
            var head = document.getElementsByTagName('head')[0];
            var needSubpage = function(page) {
                var need = false;
                $scope.survey.subpages.some(function(value, index) {
                    if(page['controller'] == value['controller']) {
                        need = true;
                    }
                });
                return need;
            };

            var subpages = _.filter(objects, function(obj) {
                return needSubpage(obj);
            });
            subpages.forEach( function(value, index) {
                var full_path = app.user.static_url+"survey/assets/js/controllers/SurveySubpages/" + value['controller'];
                if($("script[src=\""+full_path+"\"]").length == 0) {
                    var script = document.createElement('script');
                    script.type = "text/javascript";
                    script.src = full_path;
                    /* BOOM */
                    head.appendChild(script);
                }
            });
        });
    };

    $scope.market = $location.search().survey_site || "";
    $scope.filter = null;
    $scope.viewPath = app.viewPath;
    $scope.surveyorTimeFilter = 'week';
    $scope.activePage = 'overview';
    $scope.statuses = [];
    $scope.status_single = $location.search().status || "";
    $scope.has_map = false;
    if ($routeParams.surveySlug == 'fish-market-survey') {
        /* Fijian islands */
        $scope.map = {
            center: {
                lat: -17.4624892,
                lng: 179.2583049
            },
            marker: {},
            zoom: 8,
            msg: null
        };
    } else {
        /* Newport up to Astoria */
        $scope.map = {
            center: {
                lat: 45.382076,
                lng: -123.8025571
            },
            marker: {},
            zoom: 9,
            msg: null
        };
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

    surveyShared.getSurvey(function(data) {
        data.questions.reverse();
        $scope.survey = data;
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

        _.each($scope.survey.questions, function (question) {
            // save a reference to filter questions which are specified by uri
            question.filters = {};
            if (question.visualize && question.filter_questions) {
                question.filterQuestions = [];
                _.each(question.filter_questions, function (filterQuestion) {
                    question.filterQuestions.push($scope.getQuestionByUri(filterQuestion));
                });

            }
        });
        $scope.getSubpages();
        setup_columns();

        // TODO: Put this in the database somehow.
        if (data.name != "Market Survey") {
            $scope.has_map = data['has_map'];
        }
    });

    $scope.getQuestionByUri = function (uri) {
        return _.findWhere($scope.survey.questions, {'resource_uri': uri});
    };

    $scope.getQuestionBySlug = function (slug) {
        return _.findWhere($scope.survey.questions, {'slug': slug});
    };
    $scope.getRespondents = function(url) {
        // Higher order function to make the next/prve buttons work.
        return reportsCommon.getRespondents(url, $scope);
    }
});
