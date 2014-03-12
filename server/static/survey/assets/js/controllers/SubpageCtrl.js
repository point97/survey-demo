angular.module('askApp').controller('SubpageCtrl', function($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    // BLACK MAGIC
    // Synchronously get the name of the controller form the database
    /*newControllerName = null;
    $.ajax({
        async: false,
        url: "/api/v1/surveysubpage/?format=json&slug=" + $routeParams.subpageSlug,
    }).success(function(data) {
        newControllerName = data['objects'][0]['controller'];
        var full_path = app.user.static_url+"survey/assets/js/controllers/SurveySubpages/" + newControllerName;
        if($("script[src=\""+full_path+"\"]").length == 0) {
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.src = full_path;
            /* BOOM */
          /*  head.appendChild(script);
            while (typeof(window[newControllerName.replace(".js", "")]) == 'undefined') {
                // BE SYNCHRONOUS
            }
        }
    });

    return window[newControllerName.replace(".js", "")](arguments);*/

    var newControllerName = null;
    $.ajax({
        async: false,
        url: "/api/v1/surveysubpage/?format=json&slug=" + $routeParams.subpageSlug,
    }).success(function(data) {
        newControllerName = data['objects'][0]['controller'];
        window[newControllerName.replace(".js", "")](arguments);
    });

});

