//'use strict';

var app = {};

app.server = window.location.protocol + '//' + window.location.host;
app.viewPath = app.server + '/static/survey/';

angular.module('askApp', ['ui', 'ui.bootstrap', 'ngGrid'])
    .run(function($rootScope) {
        $rootScope.sidenav_size = "col-md-3";
        $rootScope.viewport_size = "col-md-9 col-sm-9";
    })
    .config(function($routeProvider, $httpProvider, $compileProvider) {

    $compileProvider.urlSanitizationWhitelist(/^\s*((https?|ftp|mailto):)|#/);
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';

    $routeProvider.when('/author/:surveySlug', {
        templateUrl: app.viewPath + 'views/author.html',
        controller: 'AuthorCtrl',
        reloadOnSearch: false
    })
        .when('/author', {
        templateUrl: app.viewPath + 'views/author.html',
        controller: 'AuthorCtrl',
        reloadOnSearch: false
    })
        .when('/', {
        templateUrl: app.viewPath + 'views/LandingPage.html',
        controller: 'SurveyListMenuCtrl',
        reloadOnSearch: false
    })
        .when('/surveys', {
        templateUrl: app.viewPath + 'views/SurveyList.html',
        controller: 'SurveyListCtrl'
    })
        .when('/survey/:surveySlug/reports/:reportName', {
        templateUrl: app.viewPath + 'views/Reports.html',
        controller: 'ReportCtrl',
        reloadOnSearch: false
    })
        .when('/survey/:surveySlug/complete/:uuidSlug', {
        templateUrl: app.viewPath + 'views/complete.html',
        controller: 'CompleteCtrl'
    })
        .when('/survey/:surveySlug/complete/:uuidSlug/:action/:questionSlug', {
        templateUrl: app.viewPath + 'views/complete.html',
        controller: 'CompleteCtrl'
    })
        .when('/survey/:surveySlug/:questionSlug/:uuidSlug', {
        templateUrl: app.viewPath + 'views/SurveyDetail.html',
        controller: 'SurveyDetailCtrl'
    })
        .when('/survey/:surveySlug/:uuidSlug', {
        templateUrl: app.viewPath + 'views/landing.html',
        controller: 'SurveyDetailCtrl'
    })
        .when('/RespondantList/:surveySlug', {
        templateUrl: app.viewPath + 'views/RespondantList.html',
        controller: 'RespondantListCtrl',
        reloadOnSearch: false
    })
        .when('/RespondantList/:surveySlug/:subpageSlug', {
        templateUrl: app.viewPath + 'views/Subpage.html',
        controller: 'SubpageCtrl',
        reloadOnSearch: false
    })
        .when('/RespondantDetail/:surveySlug/:uuidSlug', {
        templateUrl: app.viewPath + 'views/RespondantDetail.html',
        controller: 'RespondantDetailCtrl'
    })
        .when('/crosstab/:surveySlug/:questionSlugX/:questionSlugY', {
        templateUrl: app.viewPath + 'views/crosstab.html',
        controller: 'CrossTabCtrl'
    })
        .otherwise({
        templateUrl: app.viewPath + 'views/LandingPage.html',
        controller: 'SurveyListMenuCtrl',
        redirectTo: '/'
    });
});
