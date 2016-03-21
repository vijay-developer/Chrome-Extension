(function($, utils, $HELPER){
    var $app = window.vgrome;

    $app.controller('CalendarCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller',
        function ($scope, $compile, $lang, $apiProvider, $controller) {

            $.extend(this, $controller('EntityCtrl', {$scope: $scope}));
            $scope.trans = $lang.translate;

            window.calendarCtrl = $scope;

            $scope.mode = 'index';

            $scope.focusFields = { events: [], tasks: [] };
            $scope.focusObject = 'Calendar';
            $scope.focusId = '';

            $scope.listViewData = { events: [], tasks: [] };
            $scope.listViewHeaderColumns = {};

            $scope.enableShowRefList = enableShowRefList = function(originObject, originId) {
                $scope.listViewData = { events: [], tasks: [] };
                $scope.listViewHeaderColumns = { events: userdata.search_config['Events'], tasks: userdata.search_config['Calendar'] };

                $apiProvider.findListRef(originObject, originId, 'Calendar', $scope.listViewHeaderColumns, function(result) {
                    utils.log(originObject+':explode ref list('+$scope.focusObject+'):' + $scope.focusId);
                    if(result.success) {
                        _.each(result.records['tasks'], function(record) {
                            var data = {};
                            _.each($scope.listViewHeaderColumns['tasks'], function(field) {
                                var recordValue = record[field.name];

                                if($HELPER.inArray(field.name, ['date_start', 'due_date'])) {
                                    if(field.name == 'date_start') {
                                        recordValue += ' ' + record['time_start'];
                                    } else if(field.name == 'due_date') {
                                        recordValue += ' ' + record['time_end'];
                                    }
                                }

                                data[field.name] = $HELPER.formatValueByField(field, recordValue);
                                if(arrayContains(field.type.name, ['reference', 'owner'])) {
                                    data[field.name + '_display'] = record[field.name + '_display'];
                                }
                            });
                            data['id'] = record.id;
                            $scope.listViewData['tasks'].push(data);
                        });

                        _.each(result.records['events'], function(record) {
                            var data = {};
                            _.each($scope.listViewHeaderColumns['events'], function(field) {
                                var recordValue = record[field.name];

                                if($HELPER.inArray(field.name, ['date_start', 'due_date'])) {
                                    if(field.name == 'date_start') {
                                        recordValue += ' ' + record['time_start'];
                                    } else if(field.name == 'due_date') {
                                        recordValue += ' ' + record['time_end'];
                                    }
                                }

                                data[field.name] = $HELPER.formatValueByField(field, recordValue);
                                if(arrayContains(field.type.name, ['reference', 'owner'])) {
                                    data[field.name + '_display'] = record[field.name + '_display'];
                                }
                            });
                            data['id'] = record.id;
                            $scope.listViewData['events'].push(data);
                        });

                        $scope.switchMode('ref-list');
                        utils.hideLoading();
                    } else {
                        utils.handleError(result, 'Calendar');
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

                post['time_start'] = post['date_start'][1];
                post['date_start'] = post['date_start'][0];
                post['time_end'] = post['due_date'][1];
                post['due_date'] = post['due_date'][0];

                if($scope.focusObject == 'Calendar') {
                    if(empty(post['activitytype'])) {
                        post['activitytype'] = 'Task';
                    }

                    if(empty(post['visibility'])) {
                        post['visibility'] = 'Public';
                    }
                } else if($scope.focusObject == 'Events') {
                    if(empty(post['activitytype'])) {
                        post['activitytype'] = 'Call';
                    }

                    if(empty(post['visibility'])) {
                        post['visibility'] = 'Public';
                    }
                }

                //Calculate duration hours and minutes
                utils.showLoading();
                $apiProvider.createObject($scope.focusObject, post, function(result){
                    if(result.success) {
                        var record = result.record;
                        utils.hideLoading();
                        $scope.enableShowDetail(record.id);
                        $scope.needToReloadRefList = true;
                    } else {
                        utils.handleError(result, 'Calendar');
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

                post['time_start'] = post['date_start'][1];
                post['date_start'] = post['date_start'][0];
                post['time_end'] = post['due_date'][1];
                post['due_date'] = post['due_date'][0];

                if($scope.focusObject == 'Calendar') {
                    if(empty(post['activitytype'])) {
                        post['activitytype'] = 'Task';
                    }

                    if(empty(post['visibility'])) {
                        post['visibility'] = 'Public';
                    }
                } else if($scope.focusObject == 'Events') {
                    if(empty(post['activitytype'])) {
                        post['activitytype'] = 'Call';
                    }

                    if(empty(post['visibility'])) {
                        post['visibility'] = 'Public';
                    }
                }

                if($scope.focusObject == 'Calendar' || $scope.focusObject == 'Events') {
                    if(!empty(window.summaryData) && window.summaryData.type == 'Leads') {
                        post['parent_id'] = summaryData.id;
                    }
                }

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

            $scope.backHistory = backHistory = function () {
                if(window.summaryData) {
                    $scope.mode = 'ref-list';

                    if(summaryData && $scope.needToReloadRefList) {
                        utils.showLoading('Reloading data...');
                        $scope.enableShowRefList(summaryData.type, summaryData.id);
                        $scope.needToReloadRefList = false;
                    }
                } else {
                    $scope.mode = 'index';
                }
            };
        }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);