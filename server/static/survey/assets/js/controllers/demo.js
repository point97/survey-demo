angular.module('askApp')
    .controller('DemoCtrl', function($scope, $location) {
        if (document.cookie.search("clicked_through_demo=true") != -1) {
            $location.path("/");
        }

        $scope.clickedThroughDemo = function() {
            document.cookie = "clicked_through_demo=true;" + document.cookie;
            $location.path("/");
        }
})
