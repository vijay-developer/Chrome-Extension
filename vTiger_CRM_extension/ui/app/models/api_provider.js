(function(utils, props, $, $HELPER){

    var $app = window.netvill;

    // Define language
    $app.lang = {
        AUTH_FAILED: 'auth failed',
        AUTH_SUCCESS: 'auth failed',
        CANT_GET_VT_TOKEN: 'Can not get VTiger token, please check panel configuration',

        MODULE_NAME_Accounts: 'Organization',
        MODULE_NAME_Contacts: 'Contacts',
        MODULE_NAME_Products: 'Products',
        MODULE_NAME_Campaigns: 'Campaigns',
        MODULE_NAME_HelpDesk: 'Tickets',
        MODULE_NAME_Leads: 'Leads',
        MODULE_NAME_Potentials: 'Opportunities',
        MODULE_NAME_Invoice: 'Invoice',
        MODULE_NAME_Quotes: 'Quotes',
        MODULE_NAME_Users: 'Users',
        MODULE_NAME_Groups: 'Groups',
        MODULE_NAME_Calendar: 'Calendar',
        MODULE_NAME_Events: 'Events',

        MANY_Accounts: 'Organization',
        MANY_Contacts: 'Contacts',
        MANY_Leads: 'Leads',
        MANY_Potentials: 'Opportunities',
        MANY_HelpDesk: 'Tickets',
        MANY_Products: 'Products',
        MANY_Campaigns: 'Campaigns',
        MANY_Invoice: 'Invoice',
        MANY_Quotes: 'Quotes',
        MANY_Calendar: 'Tasks',
        MANY_Events: 'Events',

        SINGLE_Accounts: 'Organization',
        SINGLE_Contacts: 'Contact',
        SINGLE_Leads: 'Lead',
        SINGLE_Potentials: 'Opportunity',
        SINGLE_HelpDesk: 'Ticket',
        SINGLE_Products: 'Product',
        SINGLE_Campaigns: 'Campaign',
        SINGLE_Invoice: 'Invoice',
        SINGLE_Quotes: 'Quote',
        SINGLE_Events: 'Event',
        SINGLE_Calendar: 'Task',
        All: 'All',
    };

    $app.provider('apiProvider', function () {
        this.$get = function () {
            function authPost(path, params, callback) {
				if(path != 'ping'){
					var sid = $.jStorage.get('__sid');
					params['sid'] = sid;

					$.post(props.serviceBaseUrl + '/' + path, params, function(result){
						callback(result);
					});
				} else {
					alert('ping path')
				}
            }

            function authGet(path, params, callback) {
                var sid = $.jStorage.get('__sid');
                params.push('sid='+sid);
                var fullUrl = params.join('&');

                $.get(props.serviceBaseUrl + '/' + path + '?'+fullUrl, function(result){
                    callback(result);
                });
            }

            return {
                login: function (username, authKey, callback) {
					var loginURLService = props.serviceBaseUrl + "?operation=login&username=" + username
					//props.serviceBaseUrl + '/login'
                    $.post(loginURLService, {username: username, auth_key: authKey}, function(result) {
						alert("login => " + result)
                        callback(result);
                    });
                },
                logout: function (callback) {
                    authPost('logout', {}, function(result){
                        callback(result);
                    });
                },
                getPreferences: function (callback) {
                    authGet('preferences', [], function (userProfile) {
                        callback(userProfile);
                    });
                },
                search: function(obj, val, limit, searchConfig, callback) {
                    authGet('search', [
                        'o='+obj,
                        'n='+val,
                        'l='+limit
                    ],
                    function(result) {
                        callback(result);
                    });
                },
                lookUp: function(obj, val, rt, callback){
                    authGet('lookup', ['o='+obj, 'r=' + rt, 'i='+val], function(result){
                        callback(result);
                    });
                },
                multipleLookUp: function(objs, val, rt, callback){
                    authGet('multipleLookup', ['o='+objs, 'r=' + rt, 'i='+val], function(result){
                        callback(result);
                    });
                },
                getDetails: function(obj, val, callback){
                    authGet('details', ['o='+obj, 'i='+val], function(result){
                        callback(result);
                    });
                },
                createObject: function(obj, data, callback){
                    if(data['assigned_user_id'] == undefined) {
                        data['assigned_user_id'] = '19x1';
                    }
                    authPost('create', {o: obj, d: data}, function(result){
                        callback(result);
                    });
                },
                updateObject: function(obj, id, data, callback) {
                    authPost('update', {o: obj, i: id, d: data}, function(result) {
                        callback(result);
                    });
                },
                createEmail: function(linkToId, data, callback) {
                    authPost('createEmail', {linkTo: linkToId, d: data}, function(result) {
                        if(!empty(callback)) callback(result);
                    });
                },
                summaryFind: function(emailAddress, emailFields, callback) {
                    authGet('summaryLookup', ['e='+emailAddress, 'emf='+emailFields], function(result) {
                        callback(result);
                    });
                },
                findRef: function(obj, id, refType, callback){
                    authGet('getSingleRef', ['o='+obj, 'i='+id, 'r='+refType], function(result){
                        callback(result);
                    });
                },
                findListRef: function(obj, id, refType, columns, callback){
                    var referenceFields = [];
                    if(refType == 'Calendar') {
                        _.each(columns['tasks'], function(column) {
                            if(arrayContains(column.type.name, ['reference', 'owner'])) referenceFields.push(column.name);
                        });
                        _.each(columns['events'], function(column) {
                            if(arrayContains(column.type.name, ['reference', 'owner'])) referenceFields.push(column.name);
                        });
                    } else {
                        _.each(columns, function(column) {
                            if(arrayContains(column.type.name, ['reference', 'owner'])) referenceFields.push(column.name);
                        });
                    }
                    authGet('getListRef', ['o='+obj, 'i='+id, 'r='+refType, 'flds='+referenceFields.join('|')], function(result){
                        callback(result);
                    });
                },
                searchProductByName: function(val, limit, page, callback){
                    authGet('searchProductByName', ['n='+val, 'l='+limit, 'p='+page], function(result){
                        callback(result);
                    });
                },
                searchServiceByName: function(val, limit, page, callback){
                    authGet('searchServiceByName', ['n='+val, 'l='+limit, 'p='+page], function(result){
                        callback(result);
                    });
                },
                checkEmailExistInvTiger: function(emailId, recordId, callback) {
                    authGet('checkEmailLinking', ['ei='+emailId, 'ri='+recordId], function(result) {
                        callback(result);
                    });
                },
                ping: function() {
                    authPost('ping', [], function() {
                    });
                }
            };
        };
    });

    $app.provider('lang', function(){
        this.$get = function(){
            return {
                translate: function(s) {
                    return $app.lang[s];
                },
                multiple: function(moduleName, toLowerCase){
                    if(moduleName == undefined) {
                        return '';
                    }
                    toLowerCase = toLowerCase | false;
                    if(moduleName == 'Groups' || moduleName == 'Users') {
                        return moduleName;
                    }

                    if(userdata.modules[moduleName] == undefined) {
                        console.log('There is no config for module ' + moduleName);
                        return '';
                    }

                    var result = userdata.modules[moduleName]['label'];
                    if(toLowerCase) result = result.toLowerCase();
                    return result;
                },
                single: function(moduleName, toLowerCase){
                    toLowerCase = toLowerCase | false;

                    if(empty(moduleName)) return '';

                    if(moduleName == 'Groups') {
                        return 'Group';
                    } else if(moduleName == 'Users') {
                        return 'User';
                    }

                    if(userdata.modules[moduleName] == undefined) {
                        console.log('not found');
                        console.log(moduleName);
                    }

                    var result = userdata.modules[moduleName]['singular'];
                    if(toLowerCase) result = result.toLowerCase();

                    return result;
                },
                getModuleName: function(recordId) {
                    if(empty(recordId)) {
                        return false;
                    }

                    var map = {
                        '1': 'Campaigns',
                        '2': 'Vendors',
                        '3': 'Faq',
                        '4': 'Quotes',
                        '5': 'PurchaseOrder',
                        '6': 'SalesOrder',
                        '7': 'Invoice',
                        '8': 'PriceBooks',
                        '9': 'Calendar',
                        '10': 'Leads',
                        '11': 'Accounts',
                        '12': 'Contacts',
                        '13': 'Potentials',
                        '14': 'Products',
                        '15': 'Documents',
                        '16': 'Emails',
                        '17': 'HelpDesk',
                        '18': 'Events',
                        '19': 'Users',
                        '20': 'Groups',
                        '21': 'Currency',
                        '22': 'DocumentFolders',
                        '23': 'CompanyDetails',
                        '24': 'PBXManager',
                        '25': 'ServiceContracts',
                        '26': 'Services',
                        '27': 'Assets',
                        '28': 'ModComments',
                        '29': 'ProjectMilestone',
                        '30': 'ProjectTask',
                        '31': 'Project',
                        '32': 'SMSNotifier',
                        '33': 'LineItem',
                        '34': 'Tax',
                        '35': 'ProductTaxes',
                    };


                    var idComs = recordId.split('x');
                    var moduleId = idComs[0];

                    return map[moduleId];
                }
            };
        };
    });
})(UTILS, PROPS, jQuery, window.VTEHelperInstance);