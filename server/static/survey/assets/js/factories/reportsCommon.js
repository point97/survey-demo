angular.module('askApp').factory('reportsCommon', function($http, $routeParams, $location) {
    var factory = {};

    factory.build_crosstab_url = function (sdate, edate, slug, qa, qb, extra_stuff) {
        var url = ['/reports/crosstab', slug, qa, qb].join('/');
        url = url + '?startdate=' + sdate;
        url = url + '&enddate=' + edate;

        if (typeof(extra_stuff['group']) != 'undefined' && extra_stuff['group'] != null) {
            //url = url + '&group=' + $extra.surveyorTimeFilter;
            url += '&group=' + extra_stuff['group'];
        }

        if (typeof(extra_stuff['extra_dropdown']) != 'undefined' && extra_stuff['extra_dropdown'] != null) {
            // url = url + '&market=' + $scope.market;
            url += '&' + extra_stuff['extra_dropdown_str'] + '=' + extra_stuff['extra_dropdown'];
        }
        if (typeof(extra_stuff['status']) != 'status' && extra_stuff['status'] != null) {
            // url += '&status=' + $scope.status_single;
            url += '&status=' + extra_stuff['status'];
        }

        return url;
    }

    factory.build_survey_stats_url = function($scope) {
        var start_date = new Date($scope.filter.startDate).toString('yyyy-MM-dd');
        var end_date = new Date($scope.filter.endDate).add(1).day().toString('yyyy-MM-dd');
        var url = '/report/surveyor-stats/' + $routeParams.surveySlug + '/' + $scope.surveyorTimeFilter;
        url += '?start_date=' + start_date;
        url += '&end_date=' + end_date;

        if ($scope.market) {
            url += '&market=' + $scope.market;
        }

        if ($scope.status_single) {
            url += '&status=' + $scope.status_single;
        }
        return url;
    }
    factory.setup_arbitrary_dropdown = function($scope, questionSlug) {
        var url = "/report/distribution/" + $routeParams.surveySlug + "/" + questionSlug

        $http.get(url).success(function(data) {
            $scope.extra_dropdown_str = questionSlug;
            $scope.extra_dropdown_filter = true;
            var items = _.pluck(data.answer_domain, "answer_text");
            if (typeof(items[0]) == 'undefined')
                items = _.pluck(data.answer_domain, "answer");
            $scope.extra_dropdown_items = items;
        });
    }

    factory.build_url_for_respondant = function($scope, respondant) {
        return "#/RespondantDetail/" + $scope.survey.slug +
            "/" + respondant.uuid + "?" + $scope.filtered_list_url;
    }

    factory.getRespondents = function (url, $scope) {
        $scope.respondentsLoading = true;
        if (! url) {
            url = '/api/v1/reportrespondant/?format=json&limit=10&survey__slug__exact=' + $routeParams.surveySlug;
        }

        var location_obj = {};
        var start_date = $scope.filter.startDate.valueOf();
        var end_date = $scope.filter.endDate.valueOf();
        var status_single = $scope.status_single;
        var market = $scope.market;

        if (start_date && url.indexOf("&ts__gte=") == -1) {
            var str = new Date(start_date).toString('yyyy-MM-dd');
            location_obj.ts__gte = new Date(start_date).valueOf();
            url = url + '&ts__gte=' + str;
        }
        if (end_date && url.indexOf("&ts__lte=") == -1) {
            var str = new Date(end_date).add(2).day().toString('yyyy-MM-dd');
            location_obj.ts__lte = new Date(end_date).valueOf();
            url = url + '&ts__lte=' + str;
        }
        if (market && url.indexOf("&survey_site=") == -1) {
            location_obj.survey_site = market;
            url = url + '&survey_site=' + market;
        }
        if (status_single && url.indexOf("&status=") == -1) {
            location_obj.status = status_single;
            url = url + '&review_status=' + status_single;
        }
        if ($scope.extra_dropdown && url.indexOf("&" + + "=") == -1) {
            location_obj.extra_dropdown_str = $scope.extra_dropdown;
            url = url + '&' + $scope.extra_dropdown_str + '=' + $scope.extra_dropdown;
        }
        if ($scope.currentColumn && url.indexOf("&order_by=") == -1) {
            var str = $scope.sortDescending ? "-" + $scope.currentColumn.field : $scope.currentColumn.field;
            location_obj.order_by = str;
            url = url + '&order_by=' + str;
        }
        $location.search(location_obj);
        // hue hue hue:
        var params = _.map(_.keys(location_obj), function(x) { return x + "=" + location_obj[x]; }).join("&");
        var b64_url = btoa("#/RespondantList/" + $scope.survey.slug + "?" + params);
        var encoded_url = escape(b64_url);
        $scope.filtered_list_url = "filtered_list_url=" + encoded_url;

        return $http.get(url).success(function(data) {
            $scope.respondentsLoading = false;
            $scope.respondents = data.objects;
            $scope.meta = data.meta;
            $scope.statuses = data.meta.statuses;
        });
    }

    factory.dateFromISO = function (iso_str) {
        // IE8 and lower can't parse ISO strings into dates. See this
        // Stack Overflow question: http://stackoverflow.com/a/17593482
        if ($("html").is(".lt-ie9")) {
            var s = iso_str.split(/\D/);
            return new Date(Date.UTC(s[0], --s[1]||'', s[2]||'', s[3]||'', s[4]||'', s[5]||'', s[6]||''));
        }
        return new Date(iso_str);
    };

    return factory;
});
