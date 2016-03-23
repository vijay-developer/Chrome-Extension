(function($, utils, $HELPER){
    var $app = window.netvill;

    $app.controller('SearchCtrl', ['$scope', 'apiProvider', 'lang', function($scope, $apiProvider, $lang) {

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

        window.searchCtrl = $scope;

        $scope.config = {
            searchOptions: [
                {id: 'All', text: $lang.translate('All')},
                {id: 'Leads', text: $lang.translate('MANY_Leads')},
                {id: 'Contacts', text: $lang.translate('MANY_Contacts')},
                {id: 'Accounts', text: $lang.translate('MANY_Accounts')},
                {id: 'Potentials', text: $lang.translate('MANY_Potentials')},
                {id: 'HelpDesk', text: $lang.translate('MANY_HelpDesk')},
                //{id: 'Quotes', text: $lang.translate('MANY_Quotes')},
                //{id: 'Invoice', text: $lang.translate('MANY_Invoice')}
            ],
            getSearchOptions: function(){
                var options = [
                    {id: 'All', text: $lang.translate('All')},
                    {id: 'Leads', text: $lang.translate('MANY_Leads')},
                    {id: 'Contacts', text: $lang.translate('MANY_Contacts')},
                    {id: 'Accounts', text: $lang.translate('MANY_Accounts')},
                    {id: 'Potentials', text: $lang.translate('MANY_Potentials')},
                    {id: 'HelpDesk', text: $lang.translate('MANY_HelpDesk')},
                    //{id: 'Quotes', text: $lang.translate('MANY_Quotes')},
                    //{id: 'Invoice', text: $lang.translate('MANY_Invoice')}
                ];

                // Filter disabled module
                options = _.filter(options, function(item){
                    if(item.id == 'All') {
                        return true;
                    }

                    if(!empty(window.userdata.modules[item.id])) {
                        return true;
                    }
                });

                return options;
            },
            defaultSearchOption: 'All'
        };

        $scope.searchFor = 'All';

        $scope.searching = false;

        $scope.resultLength = -1;

        $scope.words = '';

        $scope.result = [];

        $scope.initCtrl = function(){

        };

        $scope.reloadSearchOptionsUI = function() {

        };

        $scope.search = search = function() {
            var searchFor = $('#searchOptions').select2('val');
            var object = searchFor;
            $scope.searching = true;
            $apiProvider.search(object, $scope.words, 5, userdata['search_config'], function(result) {
                if(result.success) {
                    // Full search
                    if(object == 'All') {
                        var searchResult = [];
                        var totalResult = 0;
                        _.each(
                            ['Leads', 'Contacts', 'Accounts', 'Potentials', 'HelpDesk', /*'Quotes', 'Invoice'*/],
                            function(currObject) {
                                var headerColumns = userdata['search_config'][currObject];
                                var records = [];

                                _.each(result.result[currObject].data, function(record) {
                                    var tmpRecord = {};
                                    _.each(headerColumns, function(column) {
                                        if(column.name == 'vte__fullname' || column.name == 'contactname') {
                                            tmpRecord[column.name] = record['firstname'] + ' ' + record['lastname'];
                                            column.type = {name: 'string'};
                                        } else {
                                            tmpRecord[column.name] = record[column.name];
                                        }

                                        if(column.type.name == 'currency') {
                                            var zeroStr = "";
                                            for(var i in userdata.currency.no_of_decimals) {zeroStr += '0'}

                                            tmpRecord[column.name] = window.userdata.currency.symbol +
                                            numeral(tmpRecord[column.name]).format('0,0.'+zeroStr);

                                            if(userdata.currency.decimal_separator == ',' && userdata.currency.grouping_separator == '.') {
                                                tmpRecord[column.name] = $HELPER.replaceAll('.', '#', tmpRecord[column.name]);
                                                tmpRecord[column.name] = $HELPER.replaceAll(',', '.', tmpRecord[column.name]);
                                                tmpRecord[column.name] = $HELPER.replaceAll('#', ',', tmpRecord[column.name]);
                                            }
                                        } else if(arrayContains(column.type.name, ['reference', 'owner'])) {
                                            tmpRecord[column.name + '_display'] = record[column.name + '_display'];
                                        }
                                    });
                                    tmpRecord['id'] = record.id;
                                    records.push(tmpRecord);
                                    totalResult++;
                                });

                                searchResult.push({
                                    records: records,
                                    headerColumns: headerColumns,
                                    searchFor: currObject
                                });
                            });

                        $scope.searchResult = searchResult;
                        $scope.searchFor = searchFor;
                        $scope.searching = false;
                        $scope.resultLength = totalResult;
                        $scope.safeApply();
                    }
                    // Search for single object
                    else
                    {
                        var headerColumns = userdata['search_config'][object];
                        var records = [];

                        _.each(result.result.data, function(record) {
                            var tmpRecord = {};
                            _.each(headerColumns, function(column){
                                if(column.name == 'vte__fullname' || column.name == 'contactname') {
                                    tmpRecord[column.name] = record['firstname'] + ' ' + record['lastname'];
                                    column.type = {name: 'string'};
                                } else {
                                    tmpRecord[column.name] = record[column.name];
                                }

                                if(column.type.name == 'currency') {
                                    var zeroStr = "";
                                    for(var i in userdata.currency.no_of_decimals) {zeroStr += '0'}

                                    tmpRecord[column.name] = window.userdata.currency.symbol +
                                    numeral(tmpRecord[column.name]).format('0,0.'+zeroStr);

                                    if(userdata.currency.decimal_separator == ',' && userdata.currency.grouping_separator == '.') {
                                        tmpRecord[column.name] = $HELPER.replaceAll('.', '#', tmpRecord[column.name]);
                                        tmpRecord[column.name] = $HELPER.replaceAll(',', '.', tmpRecord[column.name]);
                                        tmpRecord[column.name] = $HELPER.replaceAll('#', ',', tmpRecord[column.name]);
                                    }
                                } else if(arrayContains(column.type.name, ['reference', 'owner'])) {
                                    tmpRecord[column.name + '_display'] = record[column.name + '_display'];
                                }
                            });
                            tmpRecord['id'] = record.id;
                            records.push(tmpRecord);
                        });

                        $scope.searchFor = searchFor;
                        $scope.records = records;
                        $scope.headerColumns = headerColumns;
                        $scope.searching = false;
                        $scope.resultLength = records.length;
                        $scope.safeApply();
                    }
                } else {
                    utils.handleError(result, object);
                    $scope.searching = false;
                    $scope.safeApply();
                }
                $scope.$parent.initSearchEvents();
            });
        };

        $scope.goRecordDetail = goRecordDetail = function(type, id) {
            if(type == 'Contacts' || type == 'Leads') {
                var tabToOpen = 'summary';
                $scope.$parent.openTab(tabToOpen, function(){
                    var focusCtrl = angular.element('#summary-container').scope();
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