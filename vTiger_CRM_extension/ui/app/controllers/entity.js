(function($, utils, $HELPER){
    var $app = window.vgrome;

    var ignoreOnCreate = ['modifiedby', 'account_no', 'createdtime', 'duration_hours', 'duration_minutes', 'visibility'];
    var ignoreDefault = ['hdnGrandTotal','lineitems','hdnSubTotal','txtAdjustment','hdnGrandTotal','duration_hours', 'duration_minutes','hdnTaxType','discount_percent','discount_amount','hdnS_H_Amount'];
    var ignoreOnDetail = ['modifiedby'];

    $app.controller('EntityCtrl', ['$scope', '$compile', 'lang', 'apiProvider',
        function ($scope, $compile, $lang, $apiProvider) {

        $scope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        $scope.trans = $lang.translate;
        $scope.lang = $lang;
        $scope.util = $HELPER;
        $scope.user = userdata.user;

        $scope.needToReloadRefList = false;

        $scope.mode = 'index';
        $scope.focusFields = [];
        $scope.focusObject = '';
        $scope.focusId = '';

        $scope.listViewData = [];
        $scope.listViewHeaderColumns = [];
        //$scope.listViewHeaderFields = [];

        $scope.record = {};

        $scope.switchMode = switchMode = function(mode) {
            utils.log($scope.focusObject+':switchMode:'+mode+':begin');
			alert("entity " + tabName)
            utils.showLoading('loading view...');
            utils.log($scope.focusObject+':load_mode_template:begin');
            utils.downloadTemplate('app/views/general/' + mode + '-section.html', function(sectionHtml) {
                var template = angular.element(sectionHtml);
                var linkFn = $compile(template);
                var element = linkFn($scope);

                /* Compose fields */
                if(mode == 'create') {
                    var blocks = angular.copy(window.userdata['fields'][$scope.focusObject]);
                    $scope.focusFields = blocks;
                }

                if(mode == 'edit' || mode == 'create' || mode == 'detail') {
                    _.each($scope.focusFields, function(block) {
                        //Filter of fields
                        block.items = _.filter(block.items, function(field){
                            return !$HELPER.inArray(field.name, ignoreDefault);
                        });

                        switch(mode) {
                            case 'create':
                                //Filter auto fields
                                block.items = _.filter(block.items, function(field) {
                                    return field.canedit == 1 && !$HELPER.inArray(field.name, ignoreOnCreate);
                                });

                                _.each(block.items, function(field) {
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
                                        if(window.summaryData && window.summaryData.type == 'Contacts' &&
                                            arrayContains($scope.focusObject, ['HelpDesk', 'Potentials', 'Invoice', 'Quotes', 'Calendar', 'Events']) && field.referToDefault == 'Accounts') {

                                            if(!empty(window.summaryData.linkedAccount)) {
                                                field['default'] = window.summaryData.linkedAccount.id;
                                                field['displayName'] = window.summaryData.linkedAccount.accountname;
                                            }
                                        }

                                        if(field.referToDefault === 'Contacts') {
                                            if(!empty(window.summaryData) && window.summaryData.type == 'Contacts' &&
                                                arrayContains($scope.focusObject, ['HelpDesk', 'Potentials', 'Invoice', 'Quotes', 'Calendar', 'Events'])) {

                                                field['default'] = window.summaryData.id;
                                                field['displayName'] = window.summaryData.firstname + ' ' + window.summaryData.lastname;
                                            }
                                        }
                                    }
                                });
                                break;

                            case 'edit':
                                //Filter auto fields
                                block.items = _.filter(block.items, function(field){
                                    return  field.canedit == 1 && !$HELPER.inArray(field.name, ignoreOnCreate);
                                });

                                _.each(block.items, function(field) {
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
                                    else if(field.uitype.name === 'boolean') {
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

                                            $apiProvider.lookUp(referObject, field.detail_value, queryColumns, function(result) {
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

                                    field.detail_value =
                                        $HELPER.formatValueByFieldForEditing(field, field.detail_value, $scope.record);
                                });
                                break;

                            case 'detail':
                                //Filter auto fields
                                block.items = _.filter(block.items, function(field) {
                                    return field.canview == 1 && !$HELPER.inArray(field.name, ['modifiedby']);
                                });

                                _.each(block.items, function(field) {
                                    if((field.uitype.name === 'datetime' || field.uitype.name === 'date') && mode === 'detail' && field.detail_value != '') {
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
                                    else if(field.uitype.name == 'currency') {
                                        field.detail_value = $HELPER.formatValueByField(field, field.detail_value);
                                    }
                                });
                                break;
                            default:
                        }
                    });
                }

                //Sort field
                _.each($scope.focusFields, function(block){
                    block.block_order = parseInt(block.block_order);
                    block.items = _.sortBy(block.items, function(field){
                        field.order = parseInt(field.order);
                    });
                });

                // Remove block if fields.length == 0
                _.each($scope.focusFields, function(block) {
                    if (block.items.length == 0) {
                        block._disabled = true;
                    } else {
                        if ($HELPER.inArray(mode, ['detail', 'index'])) {
                            var allAreEmpty = true;
                            _.each(block.items, function (field) {
                                if (!empty(field.detail_value)) {
                                    allAreEmpty = false;
                                    return;
                                }
                            });

                            if (allAreEmpty) {
                                block._disabled = true;
                            } else {
                                block._disabled = false;
                            }
                        } else {
                            block._disabled = false;
                        }
                    }
                });

                $scope.mode = mode;
                $scope.safeApply();

                /* Compose fields */
                if($scope.focusObject == 'Events') {
                    $('#calendar-container .' + mode + '-section').html(element);
                } else {
                    $('.'+$scope.focusObject+'-container .' + mode + '-section').html(element);
                }

                $scope.$parent.reloadUI();
                $scope.$parent.initScrollEvent($('.tab-'+$scope.$parent.selectedTab)[0]);
                $scope.$parent.initDetailEvents();
                utils.hideLoading();

                $(".tab-content").animate({ scrollTop: 0 }, "fast");

                utils.log($scope.focusObject+':load_mode_template:end');
            });
            utils.log($scope.focusObject+':switchMode:'+mode+':begin');
        };

        $scope.showCreateArea = showCreateArea = function(overrideObject) {
            if(overrideObject != null && overrideObject != undefined) {
                $scope.focusObject = overrideObject;
            }

            $scope.switchMode('create');
        };

        $scope.backHistory = backHistory = function () {
            $scope.mode = 'index';
        };

        $scope.enableShowRefList = enableShowRefList = function(originObject, originId) {
            showLoading = showLoading | false;

            $scope.focusFields = userdata['fields'][$scope.focusObject];
            $scope.listViewHeaderColumns = userdata.search_config[$scope.focusObject];
            $scope.listViewData = [];
            //$scope.listViewHeaderColumns = [];

            $apiProvider.findListRef(originObject, originId, $scope.focusObject, $scope.listViewHeaderColumns, function(result) {
                utils.log(originObject+':explode ref list('+$scope.focusObject+'):' + $scope.focusId);
                if(result.success) {
                    _.each(result.records, function(record) {
                        var data = {};
                        _.each($scope.listViewHeaderColumns, function(field) {
                            var recordValue = record[field.name];
                            recordValue = $HELPER.formatValueByField(field, recordValue);
                            data[field.name] = recordValue;
                            if(arrayContains(field.type.name, ['reference', 'owner'])) {
                                data[field.name + '_display'] = record[field.name + '_display'];
                            }
                        });
                        data['id'] = record.id;
                        $scope.listViewData.push(data);
                    });

                    // Save to history
                    vgromenav.history.push({ originModule: originObject });
                    $scope.switchMode('ref-list');
                    //$scope.safeApply();
                    utils.hideLoading();
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
            });
        };

        $scope.setFocusObject = setFocusObject = function(object){
            $scope.focusObject = object;
        };

        $scope.setMode = setMode = function(mode) {
            $scope.mode = mode;
        };

        $scope.enableShowDetail = enableShowDetail = function(id) {
            $scope.focusId = id;
            $scope.focusFields = window.userdata['fields'][$scope.focusObject];
            utils.showLoading();

            $apiProvider.getDetails($scope.focusObject, id, function(result) {
                utils.log($scope.focusObject+':detail:' + $scope.focusId);
                if(result.success) {
                    var record = result.result;
                    _.each($scope.focusFields, function(block){
                        _.each(block.items, function(field) {
                            var value = record[field.name];

                            if($HELPER.inArray($scope.focusObject, ['Calendar', 'Events']) && $HELPER.inArray(field.name, ['date_start', 'due_date'])) {
                                if(field.name == 'date_start') {
                                    value += ' ' + record['time_start'];
                                } else if(field.name == 'due_date') {
                                    value += ' ' + record['time_end'];
                                }
                            }

                            field['detail_value'] = value;
                        });
                    });

                    $scope.switchMode('detail');
                    $scope.safeApply();
                    utils.hideLoading();
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
            });
        };

        $scope.enableShowEdit = enableShowEdit = function() {
            utils.log($scope.focusObject+':edit:' + $scope.focusId);
            $scope.focusFields = angular.copy(window.userdata['fields'][$scope.focusObject]);
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
                if(result.success) {
                    var record = result.record;
                    utils.hideLoading();
                    $scope.enableShowDetail(record.id);
                    //$scope.needToReloadRefList  = true;
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
            });
        };

        $scope.submitEdit = submitEdit = function(){
            var templateFields = $scope.focusFields;
            var post = {};

            _.each(templateFields, function(block){
                _.each(block.items, function(field){
                    if(field.uitype.name == 'boolean') {
                        var value = $('.edit-section #inp_'+$scope.focusObject+'_'+field.name).prop( "checked" );
                        value = value ? 1 : 0;
                    }  else {
                        var value = $('.edit-section #inp_'+$scope.focusObject+'_'+field.name).val();
                    }

                    if(field.uitype.name == 'datetime' && arrayContains(field.name, ['date_start', 'due_date'])) {
                        if(field.name == 'date_start') {
                            var subData = { time: $('.edit-section #inp_'+$scope.focusObject+'_time_start').val() };
                        } else if(field.name == 'due_date') {
                            var subData = { time: $('.edit-section #inp_'+$scope.focusObject+'_time_end').val() };
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
                    $scope.enableShowDetail(record.id);
                } else {
                    utils.handleError(result, $scope.focusObject);
                    utils.hideLoading();
                }
            });
        };

        $scope.goRecordDetail = goRecordDetail = function(type, id) {
            if(type == 'Contacts' || type == 'Leads') {
                var tabToOpen = 'person';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#person-container').scope();
                    focusCtrl.setFocusObject(type);
                    focusCtrl.enableShowDetail(type, id);
                });
            } else if(type == 'Accounts'){
                var tabToOpen = 'account';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'Potentials'){
                var tabToOpen = 'potential';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'HelpDesk') {
                var tabToOpen = 'ticket';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'Quotes') {
                var tabToOpen = 'quote';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'Invoice') {
                var tabToOpen = 'invoice';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#'+tabToOpen+'-container').scope();
                    focusCtrl.enableShowDetail(id);
                });
            } else if(type == 'Calendar') {
                var tabToOpen = 'calendar';
                indexCtrl.openTab(tabToOpen, function(){
                    calendarCtrl.setFocusObject('Calendar');
                    calendarCtrl.enableShowDetail(id);
                });
            } else if(type == 'Events') {
                var tabToOpen = 'calendar';
                indexCtrl.openTab(tabToOpen, function(){
                    calendarCtrl.setFocusObject('Events');
                    calendarCtrl.enableShowDetail(id);
                });
            }
        };

        $scope.goRecordEdit = goRecordEdit = function(type, id) {
            if(type == 'Contacts' || type == 'Leads') {
                var tabToOpen = 'person';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = personCtrl;
                    focusCtrl.setFocusObject(type);
                    focusCtrl.focusId = id;
                    focusCtrl.enableShowEdit();
                });
            } else if(type == 'Accounts'){
                var tabToOpen = 'account';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = accountCtrl;
                    focusCtrl.focusId = id;
                    focusCtrl.enableShowEdit();
                });
            } else if(type == 'Potentials'){
                var tabToOpen = 'potential';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = potentialCtrl;
                    focusCtrl.focusId = id;
                    focusCtrl.enableShowEdit();
                });
            } else if(type == 'HelpDesk') {
                var tabToOpen = 'ticket';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = ticketCtrl;
                    focusCtrl.focusId = id;
                    focusCtrl.enableShowEdit();
                });
            } else if(type == 'Calendar') {
                var tabToOpen = 'calendar';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = calendarCtrl;
                    focusCtrl.focusId = id;
                    focusCtrl.enableShowEdit();
                });
            } else if(type == 'Events') {
                var tabToOpen = 'calendar';
                indexCtrl.openTab(tabToOpen, function(){
                    var focusCtrl = calendarCtrl;
                    focusCtrl.focusId = id;
                    focusCtrl.enableShowEdit();
                });
            }
        };

        $scope.getBuildUrl = getBuildUrl = function(path){
            var url = window.userdata.user.vtiger_url;
            if(url.charAt(url.length-1) != '/') {
                url += '/';
            }

            if(path) {
                return url + path
            }

            return url;
        };

        $scope.getDetailUrl = getDetailUrl = function(type, id){
            var vtId = id.split('x')[1];
            return $scope.getBuildUrl('index.php?module='+type+'&view=Detail&record='+vtId);
        };

        $scope.formatFieldValue = function(field, value){
            return $HELPER.formatValueByField(field, value);
        };
    }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);