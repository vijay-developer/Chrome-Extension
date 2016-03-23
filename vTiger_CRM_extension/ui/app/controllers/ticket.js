(function($, utils, $HELPER){
    var $app = window.vgrome;

    $app.controller('TicketCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller', function ($scope, $compile, $lang, $apiProvider, $controller) {

        $.extend(this, $controller('EntityCtrl', {$scope: $scope}));

        $scope.mode = 'index';

        window.ticketCtrl = $scope;

        $scope.focusFields = [];
        $scope.focusObject = 'HelpDesk';
        $scope.focusId = '';

        $scope.listViewData = [];
        $scope.listViewHeaderColumns = [];
        $scope.listViewHeaderFields = ['ticket_title', 'createdtime'];

        $scope.backHistory = backHistory = function () {
            if(window.summaryData) {
                $scope.mode = 'ref-list';

                if(summaryData && summaryData.type == 'Contacts' && $scope.needToReloadRefList) {
                    utils.showLoading('Reloading data...');
                    $scope.enableShowRefList(summaryData.type, summaryData.id);
                    $scope.needToReloadRefList = false;
                }
            } else {
                $scope.mode = 'index';
            }
        };

        $scope.submitCreate = submitCreate = function() {
            var templateFields = $scope.focusFields;
            var post = {};

            _.each(templateFields, function(block){
                _.each(block.items, function(field){
                    if(field.uitype.name == 'boolean') {
                        var value = $('.create-section #inp_'+$scope.focusObject+'_'+field.name).prop( "checked" );
                        value = value ? 1 : 0;
                    } else {
                        var value = $('.create-section #inp_'+$scope.focusObject+'_'+field.name).val();
                    }

                    value = $HELPER.formatToVTFormat(field, value);

                    post[field.name] = value;
                });
            });

            utils.showLoading();
            $apiProvider.createObject($scope.focusObject, post, function(result){
                if(result.success) {
                    var record = result.record;
                    utils.hideLoading();
                    $scope.enableShowDetail(record.id);
                    $scope.needToReloadRefList = true;
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
            });
        };

    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);