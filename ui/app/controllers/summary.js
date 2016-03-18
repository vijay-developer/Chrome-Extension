(function($, utils, $HELPER){
    var $app = window.vgrome;

    $app.controller('SummaryCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller', function ($scope, $compile, $lang, $apiProvider ,$controller) {

        $.extend(this, $controller('EntityCtrl', {$scope: $scope}));

        $scope.mode = 'index';
        $scope.focusObject = 'Contacts';
        $scope.focusFields = [];
        $scope.focusId = '';

        window.summaryCtrl = $scope;


        $scope.switchMode = switchMode = function(mode){
            _.each($scope.focusFields, function(block){
                block.items = _.filter(block.items, function(field){ return field.canview == 1 && field.name != 'modifiedby'; });

                _.each(block.items, function(field) {
                    if((field.uitype.name === 'datetime' || field.uitype.name === 'date') && mode === 'detail' && field.detail_value != '') {
                        field.detail_value = $HELPER.formatValueByField(field, field.detail_value);
                    } else if(field.uitype.name === 'picklist' || field.uitype.name === 'multipicklist') {
                        var pValues = field.uitype.picklistValues;
                        var picklistValues = [];

                        if(pValues) {
                            _.each(pValues, function(item){
                                picklistValues.push({id: item.value, text: item.label});
                            });
                        }
                        field.uitype.values = picklistValues;
                    }
                    else if(field.uitype.name === 'owner' && field.detail_value != '') {
                        if(field.detail_value.indexOf('19x') !== -1) {
                            var userList = window.userdata.user_list;
                            var userInfo = userList[field.detail_value];
                            field['displayName'] = userInfo['first_name'] + ' ' + userInfo['last_name'];
                            field['displayId'] = field.detail_value;
                        } else {
                            var groupList = window.userdata.group_list;
                            var groupInfo = groupList[field.detail_value];
                            field['displayName'] = groupInfo['groupname'];
                            field['displayId'] = field.detail_value;
                        }
                    }
                    else if(field.uitype.name == 'reference') {
                        var referObject = field.uitype.refersTo[0];
                        if(referObject === 'Accounts' && field.detail_value != '') {
                            $apiProvider.lookUp(referObject, field.detail_value, 'accountname', function(result){
                                if(!result.success) {
                                    //alert(result.msg);
                                    utils.handleError(result, referObject);
                                } else {
                                    field.displayName = result.record['accountname'];
                                    $scope.safeApply();
                                }
                            });
                        } else if(referObject === 'Contacts' && field.detail_value != '') {
                            $apiProvider.lookUp(referObject, field.detail_value, 'firstname, lastname', function(result){
                                if(!result.success) {
                                    //alert(result.msg);
                                    utils.handleError(result, referObject);
                                } else {
                                    field.displayName = result.record['firstname'] + ' ' + result.record['lastname'];
                                    $scope.safeApply();
                                }
                            });
                        }
                    }
                });
            });

            //Sort fields
            _.each($scope.focusFields, function(block){
                block.block_order = parseInt(block.block_order);
                block.items = _.sortBy(block.items, function(field){
                    field.order = parseInt(field.order);
                });
            });

            // Remove block if fields.length == 0
            _.each($scope.focusFields, function(block) {
                if(block.items.length == 0) {
                    block._disabled = true;
                } else {
                    if($HELPER.inArray(mode, ['index', 'detail'])) {
                        var allAreEmpty = true;
                        _.each(block.items, function(field){
                            if(!empty(field.detail_value)) {
                                allAreEmpty = false;
                                return;
                            }
                        });

                        block._disabled = allAreEmpty;
                    } else {
                        block._disabled = false;
                    }
                }
            });

            $scope.mode = mode;
            $scope.safeApply();
            $scope.$parent.reloadUI();
            $scope.$parent.initDetailEvents();
            utils.hideLoading();

            vgromenav.history.push({ module: $scope.focusObject, mode: $scope.mode, id: $scope.focusId });
        };

        $scope.getCurrentSummary = function(key){
            return window.initPerson[key];
        };

        $scope.backHistory = backHistory = function () {
            var lastHistoryIndex = vgromenav.history.length -1;
            var previous = vgromenav.history[lastHistoryIndex-1];
            if(($scope.focusObject == 'Events' && previous.module == 'Calendar') || ($scope.focusObject == previous.module)) {
                $scope.mode = previous.mode;
            }
        };

        $scope.setFocusObject = setFocusObject = function(module){
            $scope.focusObject = module;
        };

        $scope.enableShowDetail = enableShowDetail = function(type, id, callback) {
            $scope.focusId = id;
            var fields = [];
            if (type === 'Contacts' || type === 'Leads') {
                fields = angular.copy(window.userdata['fields'][type]['Summary']);
            }

            $scope.focusObject = type;
            $scope.focusFields = fields;
            utils.showLoading('Loading summary data...');
            $apiProvider.getDetails(type, id, function(result) {
                utils.log('Summary:detail:' + $scope.focusObject+':' + $scope.focusId);
                if(result.success) {
                    var record = result.result;
                    _.each($scope.focusFields, function(block) {
                        _.each(block.items, function(field) {
                            if(field.name == 'vte__fullname') {
                                var value = record['firstname'] + ' ' + record['lastname'];
                            } else {
                                var value = record[field.name];
                            }

                            if (value !== null && value !== undefined) {
                                field['detail_value'] = value;
                            } else {
                                field['detail_value'] = '';
                            }
                        });
                    });

                    //console.log(result.linked_account);
                    window.summaryData = {
                        id: record.id,
                        firstname: record.firstname,
                        lastname: record.lastname,
                        type: type,
                        linkedAccount: result.linked_account
                    };

                    $scope.switchMode('detail');

                    $scope.safeApply();
                    utils.hideLoading();
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }

                if(!empty(callback)) callback.call();
            });
        };

        $scope.goRecordDetail = goRecordDetail = function(type, id) {
            if(type == 'Contacts' || type == 'Leads') {
                var tabToOpen = 'person';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#person-container').scope();
                    focusCtrl.setFocusObject(type);
                    focusCtrl.enableShowDetail(type, id);
                });
            } else if(type == 'Accounts'){
                var tabToOpen = 'account';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'Potentials'){
                var tabToOpen = 'potential';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'HelpDesk') {
                var tabToOpen = 'ticket';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            }
        };

        $scope.goToCreateContactPage = function(){
            var indexScope = angular.element('#index-container').scope();
            indexScope.openTab('person', function(personScope){
                personScope.showCreateArea('Contacts');
            });
        };

        $scope.goToCreateLeadPage = function(){
            var indexScope = angular.element('#index-container').scope();
            indexScope.openTab('person', function(personScope){
                personScope.showCreateArea('Leads');
            });
        };

        $scope.hasSummaryData = function(){
            return window.summaryData != undefined && window.summaryData != false;
        };

        $scope.selectedEmail = function(){
            return window.appStatus.selectedEmail;
        }

    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);