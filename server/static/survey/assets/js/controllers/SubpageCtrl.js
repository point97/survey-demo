angular.module('askApp').controller('SubpageCtrl', function($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared) {
    $scope.surveySlug = $routeParams.surveySlug;
    // BLACK MAGIC
    var newControllerName = null;
    $.ajax({
        async: false,
        url: "/api/v1/surveysubpage/?format=json&slug=" + $routeParams.subpageSlug,
    }).success(function(data) {
        newControllerName = data['objects'][0]['controller'];
        window[newControllerName.replace(".js", "")]($scope, $rootScope, $http, $location, $routeParams, reportsCommon, surveyShared);
    });

});

