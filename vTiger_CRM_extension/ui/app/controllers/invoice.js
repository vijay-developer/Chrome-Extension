(function($, utils, $HELPER){
    var $app = window.netvill;

    $app.controller('InvoiceCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller',
        function ($scope, $compile, $lang, $apiProvider, $controller) {

        $.extend(this, $controller('InventoryCtrl', {$scope: $scope}));

        window.invoiceCtrl = $scope;

        $scope.mode = 'index';

        $scope.focusFields = [];
        $scope.focusObject = 'Quotes';
        $scope.focusId = '';

        $scope.listViewData = [];
        $scope.listViewHeaderColumns = [];
        $scope.listViewHeaderFields = ['subject', 'hdnGrandTotal', 'createdtime'];

    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);