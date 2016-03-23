(function($, utils, $HELPER){
    var $app = window.netvill;

    $app.controller('AccountCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller', function ($scope, $compile, $lang, $apiProvider, $controller) {

        $.extend(this, $controller('EntityCtrl', {$scope: $scope}));

        $scope.mode = 'index';
        $scope.focusFields = [];
        $scope.focusObject = 'Accounts';
        $scope.focusId = '';

        window.accountCtrl = $scope;

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

            if(window.summaryData.type == 'Contacts') {
                post['contact_id'] = window.summaryData.id;
            }

            utils.showLoading();
            $apiProvider.createObject($scope.focusObject, post, function(result) {
                if(result.success) {
                    var record = result.record;
                    utils.hideLoading();

                    if(!empty(window.appStatus.creatingReturnTo)) {
                        var tabToOpen = window.appStatus.creatingReturnTo.ctrlId.split('-')[0];
                        indexCtrl.openTab(tabToOpen, function(focusScope) {
                            window.appStatus.creatingReturnTo.displayField.val(record.accountname);
                            window.appStatus.creatingReturnTo.idField.val(record.id);

                            window.appStatus.creatingReturnTo = false;
                        });
                    } else {
                        $scope.enableShowDetail(record.id);
                    }
                } else {
                    utils.handleError(result, 'Accounts');
                    utils.hideLoading();
                }
            });
        };

    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);