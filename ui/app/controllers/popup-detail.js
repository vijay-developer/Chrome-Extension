(function($, utils, $HELPER){
    var $app = window.vgrome;

    $app.controller('PopupDetailCtrl', ['$scope', '$compile', 'lang', 'apiProvider',
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
            $scope.type = '';
            $scope.recordId = 0;
            $scope.focusFields = null;
            $scope.util = $HELPER;

            $scope.setRecord = setRecord = function(type, recordId, callbackWhenShow) {
                $scope.type = type;
                $scope.recordId = recordId;

                if(type == 'Contacts' || type == 'Leads') {
                    $scope.focusFields = userdata['fields'][type]['Person'];
                } else {
                    $scope.focusFields = userdata['fields'][type];
                }

                $apiProvider.getDetails(type, recordId, function(result) {
                    if(result.success) {
                        var record = result.result;
                        _.each($scope.focusFields, function(block){
                            _.each(block.items, function(field){
                                var value = $HELPER.formatValueByField(field, record[field.name]);
                                field['detail_value'] = value;
                            });
                        });

                        if($scope.focusObject === 'Quotes' || $scope.focusObject === 'Invoice') {
                            $scope.lineItems = record.lineitems;
                            $scope.hdnSubTotal = record.hdnSubTotal;
                            $scope.shipping = record.shipping;
                            $scope.txtAdjustment = record.txtAdjustment;
                            $scope.hdnGrandTotal = record.hdnGrandTotal;
                            $scope.hdnTaxType = record.hdnTaxType;
                            $scope.discount_percent = record.discount_percent;
                            $scope.discount_amount = record.discount_amount;
                            $scope.hdnS_H_Amount = record.hdnS_H_Amount;
                        }

                        $scope.render();
                        $scope.safeApply();
                        if(callbackWhenShow) callbackWhenShow();
                    } else {
                        utils.handleError(result, type);
                    }
                });
            };

            $scope.render = render = function(){
                _.each($scope.focusFields, function(block){
                    // Remove block if fields.length == 0
                    _.each($scope.focusFields, function(block) {
                        if(block.items.length == 0) {
                            block._disabled = true;
                        } else {
                            var allAreEmpty = true;
                            _.each(block.items, function(field){
                                if(!empty(field.detail_value)) {
                                    allAreEmpty = false;
                                    return;
                                }
                            });

                            block._disabled = allAreEmpty;
                        }
                    });

                    block.items = _.filter(block.items, function(field){
                        return field.canview == 1 && field.name != 'modifiedby';
                    });

                    _.each(block.items, function(field){
                        if((field.uitype.name === 'datetime' || field.uitype.name === 'date') && field.detail_value != '') {
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

                            field.detail_value = $HELPER.replaceAll(' |##| ', ', ', field.detail_value);
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
                        else if(field.uitype.name === 'owner' && mode === 'create') {
                            field['defaultName'] = userdata.user['firstname'] + ' ' + userdata.user['lastname'];
                            field['defaultId'] = userdata.user.vtiger_id;
                        }
                        else if(field.uitype.name === 'boolean' && mode === 'edit') {
                            if(parseInt(field.detail_value) == 1) {
                                field.checkboxValue = true;
                            } else {
                                field.checkboxValue = false;
                            }
                        }
                        else if(field.uitype.name === 'boolean' && mode === 'create') {
                            if(parseInt(field.default) == 1) {
                                field.default = true;
                            } else {
                                field.default = false;
                            }
                        }
                        else if(field.uitype.name == 'reference') {
                            var referObject = field.uitype.refersTo[0];
                            if(referObject === 'HelpDesk' && field.detail_value != '') {
                                $apiProvider.lookUp(referObject, field.detail_value, 'ticket_title', function(result){
                                    if(!result.success) {
                                        //alert(result.msg);
                                        utils.handleError(result, referObject);
                                    } else {
                                        field.displayName = result.record['ticket_title'];
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
                            } else if(referObject === 'Accounts' && field.detail_value != '') {
                                $apiProvider.lookUp(referObject, field.detail_value, 'accountname', function(result){
                                    if(!result.success) {
                                        //alert(result.msg);
                                        utils.handleError(result, referObject);
                                    } else {
                                        field.displayName = result.record['accountname'];
                                        $scope.safeApply();
                                    }
                                });
                            } else if(referObject === 'Products' && field.detail_value != '') {
                                $apiProvider.lookUp(referObject, field.detail_value, 'productname', function(result){
                                    if(!result.success) {
                                        //alert(result.msg);
                                        utils.handleError(result, referObject);
                                    } else {
                                        field.displayName = result.record['productname'];
                                        $scope.safeApply();
                                    }
                                });
                            }  else if(referObject === 'Campaigns' && field.detail_value != '') {
                                $apiProvider.lookUp(referObject, field.detail_value, 'campaignname', function(result){
                                    if(!result.success) {
                                        utils.handleError(result, referObject);
                                        //alert(result.msg);
                                    } else {
                                        field.displayName = result.record['campaignname'];
                                        $scope.safeApply();
                                    }
                                });
                            }
                        }
                    });
                });

                $scope.safeApply();
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
                if(id == 0) return;
                var vtId = id.split('x')[1];
                return $scope.getBuildUrl('index.php?module='+type+'&view=Detail&record='+vtId);
            };

        }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);