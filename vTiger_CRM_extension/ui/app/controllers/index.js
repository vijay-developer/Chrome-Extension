(function($, apploader, utils, props, $HELPER){
    var $app = window.netvill;
    // Define main controller
    $app.controller('IndexCtrl', ['$scope', '$rootScope', '$compile', 'apiProvider', 'lang', '$controller', function ($scope, $rootScope, $compile, $apiProvider, $lang, $controller) {

        $.extend(this, $controller('BaseIndexCtrl', {$scope: $scope}));

    }]);

})(jQuery, window.Apploader, window.UTILS, window.PROPS, window.VTEHelperInstance);