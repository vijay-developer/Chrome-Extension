(function($, utils, $HELPER){
    var $app = window.vgrome;

    $app.controller('QuoteCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller',
        function ($scope, $compile, $lang, $apiProvider, $controller) {

        $.extend(this, $controller('InventoryCtrl', {$scope: $scope}));

        window.quoteCtrl = $scope;

        $scope.mode = 'index';

        $scope.focusFields = [];
        $scope.focusObject = 'Invoice';
        $scope.focusId = '';

        $scope.listViewData = [];
        $scope.listViewHeaderColumns = [];
        $scope.listViewHeaderFields = ['subject', 'hdnGrandTotal', 'createdtime'];
    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);