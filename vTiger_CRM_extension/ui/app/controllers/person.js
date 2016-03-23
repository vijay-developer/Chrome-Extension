(function($, utils, $HELPER){
    var $app = window.netvill;

    $app.controller('PersonCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller', function ($scope, $compile, $lang, $apiProvider, $controller) {

        $.extend(this, $controller('EntityCtrl', {$scope: $scope}));

        window.personCtrl = $scope;

        $scope.mode = 'index';
        $scope.modeLoad = {
            Contacts: {
                create: false
            },
            Leads: {
                create: false
            }
        };
        $scope.focusObject = 'Contacts';
        $scope.focusFields = [];
        $scope.focusId = '';

        $scope.record = {};

        $scope.switchMode = switchMode = function(mode) {
            utils.showLoading('loading template...');
            utils.downloadTemplate('app/views/general/' + mode + '-section.html', function(sectionHtml){
                var template = angular.element(sectionHtml);
                var linkFn = $compile(template);
                var element = linkFn($scope);

                $('#person-container .' + mode + '-section').html(element);

                /* Compose fields */

                if(mode == 'create') {
                    if(!empty(angular.copy(window.userdata['fields'][$scope.focusObject]))) {
                        var blocks = angular.copy(window.userdata['fields'][$scope.focusObject]['Person']);
                        $scope.focusFields = blocks;
                    } else {
                        $scope.focusFields = [];
                    }
                }

                if(mode == 'edit' || mode == 'create' || mode == 'detail') {

                    if(mode == 'detail') {
                        // Remove if all fields in block are empty
                        var shouldBeRemove = [];
                        _.each($scope.focusFields, function(block) {
                            var needToRemove = true;
                            _.each(block.items, function(field) {
                                if(!empty(field.detail_value)) {
                                    needToRemove = false;
                                }
                            });
                            if(needToRemove) {
                                $scope.focusFields = _.reject($scope.focusFields, function(blk) {
                                    return blk.blockid == block.blockid;
                                });
                            }
                        });
                    }

                    _.each($scope.focusFields, function(block) {
                        if(mode === 'edit' || mode === 'create') {
                            block.items = _.filter(block.items, function(field){ return field.canedit == 1 && field.name != 'modifiedby' &&
                                field.name != 'modifiedtime' && field.name != 'createdtime'; });
                        } else if(mode === 'detail'){
                            block.items = _.filter(block.items, function(field){ return field.canview == 1 && field.name != 'modifiedby'; });
                        }

                        switch (mode) {
                            case 'create':
                                _.each(block.items, function(field) {
                                    if(!empty(window.initPerson)) {
                                        var names = window.initPerson.name.split(' ');
                                        var firstname = names[0];
                                        if(names[1]) {
                                            var lastname = names[1];
                                            if(names[2]) {
                                                lastname += ' ' + names[2];
                                            }
                                        } else {
                                            var lastname = '';
                                        }

                                        if(field.name == 'firstname') {
                                            field.default = firstname;
                                        } else if(field.name == 'lastname') {
                                            field.default = lastname;
                                        } else if(field.name == 'email') {
                                            field.default = window.initPerson.email;
                                        } else if(field.name.indexOf('phone') !== -1){
                                            field.default = window.initPerson.phone;
                                        }else {
                                            field.default = '';
                                        }
                                    }

                                    if(field.uitype.name === 'picklist' || field.uitype.name === 'multipicklist') {
                                        var pValues = field.uitype.picklistValues;
                                        var picklistValues = [];

                                        if(pValues) {
                                            _.each(pValues, function(item){
                                                picklistValues.push({id: item.value, text: item.label});
                                            });
                                        }
                                        field.uitype.values = picklistValues;
                                    }

                                    else if(field.name === 'salutationtype') {
                                        field.uitype.values = [
                                            {text: 'None', id: 'None'},
                                            {text: 'Ms.', id: 'Ms.'},
                                            {text: 'Mr.', id: 'Mr.'},
                                            {text: 'Mrs.', id: 'Mrs.'},
                                            {text: 'Dr.', id: 'Dr.'},
                                            {text: 'Prof.', id: 'Prof.'}
                                        ];
                                        field.uitype.defaultValue = 'Mr.';
                                    }

                                    else if(field.uitype.name === 'owner') {
                                        field['defaultName'] = userdata.user['firstname'] + ' ' + userdata.user['lastname'];
                                        field['defaultId'] = userdata.user.vtiger_id;
                                    }

                                    else if(field.uitype.name === 'boolean') {
                                        if(parseInt(field.default) == 1) {
                                            field.default = true;
                                        } else {
                                            field.default = false;
                                        }
                                    }

                                    else if(field.uitype.name == 'reference') {
                                        if(field.uitype.refersTo.length == 1) {
                                            var referObject = field.uitype.refersTo[0];
                                            field.referToDefault = referObject;
                                        } else if(field.uitype.refersTo.length > 1) {
                                            if(field.name == 'parent_id' && arrayContains('Accounts', field.uitype.refersTo)) {
                                                field.referToDefault = 'Accounts';
                                            } else {
                                                field.referToDefault = field.uitype.refersTo[0];
                                            }
                                        }

                                        //Populate for reference fields by summary data
                                        if(window.summaryData && window.summaryData.type == 'Contacts' && field.referToDefault == 'Accounts') {
                                            if(!empty(window.summaryData.linkedAccount)) {
                                                field['default'] = window.summaryData.linkedAccount.id;
                                                field['displayName'] = window.summaryData.linkedAccount.accountname;
                                            }
                                        }
                                    }
                                });
                                break;
                            case 'edit':
                                _.each(block.items, function(field){
                                    if(field.uitype.name === 'picklist' || field.uitype.name === 'multipicklist') {
                                        var pValues = field.uitype.picklistValues;
                                        var picklistValues = [];

                                        if(pValues) {
                                            _.each(pValues, function(item){
                                                picklistValues.push({id: item.value, text: item.label});
                                            });
                                        }
                                        field.uitype.values = picklistValues;
                                    }

                                    else if(field.name === 'salutationtype') {
                                        field.uitype.values = [
                                            {text: 'None', id: 'None'},
                                            {text: 'Ms.', id: 'Ms.'},
                                            {text: 'Mr.', id: 'Mr.'},
                                            {text: 'Mrs.', id: 'Mrs.'},
                                            {text: 'Dr.', id: 'Dr.'},
                                            {text: 'Prof.', id: 'Prof.'}
                                        ];
                                        field.uitype.defaultValue = 'Mr.';
                                    }

                                    else if(field.uitype.name === 'owner' && field.detail_value != '') {
                                        if(field.detail_value.indexOf('19x') !== -1) {
                                            var userList = window.userdata.user_list;
                                            var userInfo = userList[field.detail_value];
                                            field['displayName'] = userInfo['first_name'] + ' ' + userInfo['last_name'];
                                            field['displayId'] = field.detail_value;
                                            field['optVal'] = 'Users';
                                        } else {
                                            var groupList = window.userdata.group_list;
                                            var groupInfo = groupList[field.detail_value];
                                            field['displayName'] = groupInfo['groupname'];
                                            field['displayId'] = field.detail_value;
                                            field['optVal'] = 'Groups';
                                        }
                                    }

                                    else if(field.uitype.name === 'boolean' && mode === 'edit') {
                                        if(parseInt(field.detail_value) == 1) {
                                            field.checkboxValue = true;
                                        } else {
                                            field.checkboxValue = false;
                                        }
                                    }

                                    else if(field.uitype.name == 'reference') {
                                        if(field.uitype.refersTo.length == 1) {
                                            var referObject = field.uitype.refersTo[0];
                                        } else if(field.uitype.refersTo.length > 1) {
                                            var referObject = $lang.getModuleName(field.detail_value);
                                            if(!referObject) referObject = field.uitype.refersTo[0];
                                        }

                                        if(field.detail_value != '') {
                                            var nameField = '';
                                            var queryColumns = '';
                                            if(referObject == 'Accounts') {
                                                nameField = '#{accountname}';
                                                queryColumns = 'accountname';
                                            } else if(referObject == 'Contacts') {
                                                nameField = '#{firstname} #{lastname}';
                                                queryColumns = 'firstname, lastname';
                                            } else if(referObject == 'Users') {
                                                nameField = '#{first_name} #{last_name}';
                                                queryColumns = 'firstname, lastname';
                                            } else if(referObject == 'Groups') {
                                                nameField = '#{groupname}';
                                                queryColumns = 'groupname';
                                            } else if(referObject == 'Products') {
                                                nameField = '#{productname}';
                                                queryColumns = 'productname';
                                            } else if(referObject == 'Potentials') {
                                                nameField = '#{potentialname}';
                                                queryColumns = 'potentialname';
                                            } else if(referObject == 'Campaigns') {
                                                nameField = '#{campaignname}';
                                                queryColumns = 'campaignname';
                                            } else if(referObject == 'Leads') {
                                                nameField = '#{firstname} #{lastname}';
                                                queryColumns = 'firstname, lastname';
                                            } else if(referObject == 'HelpDesk'){
                                                nameField = '#{ticket_title}'
                                                queryColumns = 'ticket_title';
                                            } else {
                                                utils.log(focusObject + ' is not define nameField for popup select', 'err');
                                                return;
                                            }

                                            field.referToDefault = referObject;

                                            $apiProvider.lookUp(referObject, field.detail_value, queryColumns, function(result){
                                                if(!result.success) {
                                                    utils.handleError(result, referObject);
                                                } else {
                                                    field.displayName = $.tmpl(nameField, result.record);
                                                    $scope.safeApply();
                                                }
                                            });
                                        } else {
                                            field.referToDefault = field.uitype.refersTo[0];
                                        }
                                    }

                                    field['detail_value'] = $HELPER.formatValueByFieldForEditing(field, field['detail_value'], $scope.record);
                                });
                                break;
                            case 'detail':
                                _.each(block.items, function(field){

                                    if((field.uitype.name === 'datetime' || field.uitype.name === 'date' && mode === 'detail') && field.detail_value != '') {
                                        field.detail_value = $HELPER.formatValueByField(field, field.detail_value);
                                    }

                                    if(field.uitype.name === 'picklist' || field.uitype.name === 'multipicklist') {
                                        var pValues = field.uitype.picklistValues;
                                        var picklistValues = [];

                                        if(pValues) {
                                            _.each(pValues, function(item){
                                                picklistValues.push({id: item.value, text: item.label});
                                            });
                                        }
                                        field.uitype.values = picklistValues;

                                        if(mode === 'detail') {
                                            field.detail_value = $HELPER.replaceAll(' |##| ', ', ', field.detail_value);
                                        }
                                    }

                                    else if(field.uitype.name === 'owner' && field.detail_value != '') {
                                        if(field.detail_value.indexOf('19x') !== -1) {
                                            var userList = window.userdata.user_list;
                                            var userInfo = userList[field.detail_value];
                                            field['displayName'] = userInfo['first_name'] + ' ' + userInfo['last_name'];
                                            field['displayId'] = field.detail_value;
                                            field['optVal'] = 'Users';
                                        } else {
                                            var groupList = window.userdata.group_list;
                                            var groupInfo = groupList[field.detail_value];
                                            field['displayName'] = groupInfo['groupname'];
                                            field['displayId'] = field.detail_value;
                                            field['optVal'] = 'Groups';
                                        }
                                    }
                                    else if(field.uitype.name == 'reference') {

                                        if(field.uitype.refersTo.length == 1) {
                                            var referObject = field.uitype.refersTo[0];
                                        } else if(field.uitype.refersTo.length > 1) {
                                            var referObject = $lang.getModuleName(field.detail_value);
                                            if(!referObject) referObject = field.uitype.refersTo[0];
                                        }

                                        if(field.detail_value != '') {
                                            var nameField = '';
                                            var queryColumns = '';
                                            if(referObject == 'Accounts') {
                                                nameField = '#{accountname}';
                                                queryColumns = 'accountname';
                                            } else if(referObject == 'Contacts') {
                                                nameField = '#{firstname} #{lastname}';
                                                queryColumns = 'firstname, lastname';
                                            } else if(referObject == 'Users') {
                                                nameField = '#{first_name} #{last_name}';
                                                queryColumns = 'firstname, lastname';
                                            } else if(referObject == 'Groups') {
                                                nameField = '#{groupname}';
                                                queryColumns = 'groupname';
                                            } else if(referObject == 'Products') {
                                                nameField = '#{productname}';
                                                queryColumns = 'productname';
                                            } else if(referObject == 'Potentials') {
                                                nameField = '#{potentialname}';
                                                queryColumns = 'potentialname';
                                            } else if(referObject == 'Campaigns') {
                                                nameField = '#{campaignname}';
                                                queryColumns = 'campaignname';
                                            } else if(referObject == 'Leads') {
                                                nameField = '#{firstname} #{lastname}';
                                                queryColumns = 'firstname, lastname';
                                            } else if(referObject == 'HelpDesk'){
                                                nameField = '#{ticket_title}'
                                                queryColumns = 'ticket_title';
                                            } else {
                                                utils.log(focusObject + ' is not define nameField for popup select', 'err');
                                                return;
                                            }

                                            field.referToDefault = referObject;

                                            $apiProvider.lookUp(referObject, field.detail_value, queryColumns, function(result){
                                                if(!result.success) {
                                                    utils.handleError(result, referObject);
                                                } else {
                                                    field.displayName = $.tmpl(nameField, result.record);
                                                    field.referToModule = referObject;
                                                    $scope.safeApply();
                                                }
                                            });
                                        } else {
                                            field.referToDefault = field.uitype.refersTo[0];
                                        }
                                    }
                                });
                                break;
                            default:
                        }
                    });
                }

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
                        if ($HELPER.inArray(mode, ['detail', 'index'])) {
                            var allAreEmpty = true;
                            _.each(block.items, function(field){
                                if(!empty(field.detail_value)) {
                                    allAreEmpty = false;
                                    return;
                                }
                            });

                            block._disabled = allAreEmpty;
                        } else {
                            block._disabled  = false;
                        }
                    }
                });

                $scope.mode = mode;
                $scope.safeApply();
                $scope.$parent.reloadUI();
                $scope.$parent.initScrollEvent($('.tab-'+$scope.$parent.selectedTab)[0]);
                $scope.$parent.initDetailEvents();

                $(".tab-content").animate({ scrollTop: 0 }, "fast");

                utils.hideLoading();
            });
        };

        $scope.showCreateArea = showCreateArea = function(module) {
            $scope.focusObject = module;
            $scope.switchMode('create');
        };

        $scope.backHistory = backHistory = function () {
            $scope.mode = 'index';
        };

        $scope.setFocusObject = setFocusObject = function(module){
            $scope.focusObject = module;
        };

        $scope.enableShowDetail = enableShowDetail = function(type, id) {
            $scope.focusId = id;
            $scope.focusObject = type;
            var fields = [];
            if (type === 'Contacts' || type === 'Leads') {
                fields = angular.copy(window.userdata['fields'][type]['Person']);
            }

            $scope.focusFields = fields;
            utils.showLoading('Loading person data...');
            $apiProvider.getDetails(type, id, function(result){
                utils.log('Person:detail:' + $scope.focusObject+':' + $scope.focusId);
                if(result.success) {
                    var record = result.result;
                    _.each($scope.focusFields, function(block){
                        _.each(block.items, function(field){
                            var value = record[field.name];
                            if (value !== null && value !== undefined) {
                                field['detail_value'] = value;
                            } else {
                                field['detail_value'] = '';
                            }
                        });
                    });

                    $scope.switchMode('detail');
                    $scope.safeApply();
                    utils.hideLoading();
                } else {
                    utils.handleError(result, type);
                    utils.hideLoading();
                }
            });
        };

        $scope.enableShowEdit = enableShowEdit = function() {
            utils.log('Person:edit:'+$scope.focusObject + ':' + $scope.focusId);
            var fields = [];
            if ($scope.focusObject === 'Contacts' || $scope.focusObject === 'Leads') {
                fields = angular.copy(window.userdata['fields'][$scope.focusObject]['Person']);
            }

            $scope.focusFields = fields;

            utils.showLoading();
            $apiProvider.getDetails($scope.focusObject, $scope.focusId, function(result){
                if(result.success) {
                    var record = result.result;
                    $scope.record = record;
                    _.each($scope.focusFields, function(block){
                        _.each(block.items, function(field){
                            var value = record[field.name];
                            if (value !== null && value !== undefined) {
                                field['detail_value'] = value;
                            } else {
                                field['detail_value'] = '';
                            }
                        });
                    });

                    $scope.switchMode('edit');
                    $scope.safeApply();
                    utils.hideLoading();
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
            });
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

                    if(field.uitype.name == 'datetime' && arrayContains(field.name, ['date_start', 'due_date'])) {
                        if(field.name == 'date_start') {
                            var subData = { time: $('.create-section #inp_'+$scope.focusObject+'_time_start').val() };
                        } else if(field.name == 'due_date') {
                            var subData = { time: $('.create-section #inp_'+$scope.focusObject+'_time_end').val() };
                        }

                        value = $HELPER.formatToVTFormat(field, value, subData);
                    } else {
                        value = $HELPER.formatToVTFormat(field, value);
                    }

                    post[field.name] = value;
                });
            });

            utils.showLoading();
            $apiProvider.createObject($scope.focusObject, post, function(result){
                utils.hideLoading();
                if(result.success) {
                    var record = result.record;
                    //Update summary data and summary view
                    var indexScope = angular.element('#index-container').scope();
                    indexScope.headerText = record.firstname + ' ' + record.lastname;

                    // Return to prev page
                    if(!empty(window.appStatus.creatingReturnTo)) {
                        var tabToOpen = window.appStatus.creatingReturnTo.ctrlId.split('-')[0];
                        indexCtrl.openTab(tabToOpen, function(focusScope) {
                            window.appStatus.creatingReturnTo.displayField.val(record.accountname);
                            window.appStatus.creatingReturnTo.idField.val(record.id);

                            window.appStatus.creatingReturnTo = false;
                        });
                    } else {
                        indexScope.openTab('summary', function(summaryScope) {
                            summaryScope.enableShowDetail($scope.focusObject, record.id, function(){
                                //Update netvill buttons
                                window.Scanner.updatenetvillBtn();
                            });
                        });
                    }

                    $scope.mode = 'index';
                    $scope.safeApply();

                    //$scope.enableShowDetail($scope.focusObject, record.id);
                } else {
                    utils.handleError(result, $scope.focusObject);
                }
            });
        };

        $scope.submitEdit = submitEdit = function(){
            var templateFields = $scope.focusFields;
            var post = {};

            _.each(templateFields, function(block){
                _.each(block.items, function(field){
                    if(field.uitype.name == 'boolean') {
                        var value = $('.edit-section #inp_'+$scope.focusObject+'_'+field.name).prop("checked");
                        value = value ? 1 : 0;
                    } else {
                        var value = $('.edit-section #inp_'+$scope.focusObject+'_'+field.name).val();
                    }

                    if(field.uitype.name == 'datetime' && arrayContains(field.name, ['date_start', 'due_date'])) {
                        if(field.name == 'date_start') {
                            var subData = { time: $('.create-section #inp_'+$scope.focusObject+'_time_start').val() };
                        } else if(field.name == 'due_date') {
                            var subData = { time: $('.create-section #inp_'+$scope.focusObject+'_time_end').val() };
                        }

                        value = $HELPER.formatToVTFormat(field, value, subData);
                    } else {
                        value = $HELPER.formatToVTFormat(field, value);
                    }

                    if(value != '') {
                        post[field.name] = value;
                    }
                });
            });

            utils.showLoading();
            $apiProvider.updateObject($scope.focusObject, $scope.focusId, post, function(result){
                if(result.success) {
                    var record = result.record;
                    utils.hideLoading();
                    $scope.enableShowDetail($scope.focusObject, record.id);
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
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
            } else if(type == 'Quotes') {
                var tabToOpen = 'quote';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'Invoice') {
                var tabToOpen = 'invoice';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            }
        };

    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);