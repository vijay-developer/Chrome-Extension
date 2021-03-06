(function($, apploader, utils, props, $HELPER){
    var $app = window.netvill;
    // Define main controller
    $app.controller('BaseIndexCtrl', ['$scope', '$rootScope', '$compile', 'apiProvider', 'lang', function ($scope, $rootScope, $compile, $apiProvider, $lang) {
        var guessTab = 'config';
        $scope.auth = false;
        $scope.selectedTab = '';
        $scope.headerText = '';
        $scope.trans = $lang.translate;
        $scope.lang = $lang;
        window.indexCtrl = $scope;

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

        /* Tab methods */
        $scope.tabsList = [
            //{name: 'calendar', label: 'Calendar', icon: 'fa fa-calendar', order: 5, modules: ['Calendar', 'Events'], enable: 1},
            {name: 'config', label: 'Setting', icon: 'glyphicon glyphicon-cog', order: 9, modules: [], enable: 1},
            //{name: 'potential', label: 'Opportunity', icon: 'fa fa-usd', order: 6, modules: ['Potentials'], enable: 1},
            //{name: 'account', label: 'Organization', icon: 'fa fa-building', order: 4, modules: ['Accounts'], enable: 1},
            {name: 'person', label: 'Lead', icon: 'glyphicon glyphicon-user', order: 3, modules: ['Contacts', 'Leads'], enable: 1},
            //{name: 'quote', label: 'Quotes', icon: 'fa fa-file-text-o', order: 8},
            //{name: 'invoice', label: 'Invoice', icon: 'glyphicon glyphicon-usd', order: 8},
            //{name: 'search', label: 'Search', icon: 'glyphicon glyphicon-search', order: 1, modules: [], enable: 1},
            {name: 'summary', label: 'Detail', icon: 'fa fa-list', order: 2, modules: ['Contacts', 'Leads'], enable: 1}
            //,{name: 'ticket', label: 'Ticket', icon: 'fa fa-life-ring', order: 7, modules: ['HelpDesk'], enable: 1}
        ];

        $scope.collapseSidebar = collapseSidebar = function () {
            var sidebarState = $('#netvill_ext').hasClass('off') ? 'on' : 'off';
            apploader.switchSidebarState(sidebarState);
        };

        $scope.reloadTabList = function() {
            // Filter disabled module
            _.each($scope.tabsList, function(item){
                if(item.modules.length == 0) {
                    return true;
                }

                var hiddenCount = 0;
                _.each(item.modules, function(module) {
                    if(empty(window.userdata.modules[module])) {
                        hiddenCount++;
                    }
                });

                if(item.modules.length <= hiddenCount) {
                    item.enable = 0;
                } else {
                    item.enable = 1;
                }
            });

            $scope.safeApply();
        };

        function initTasks() {
            // Ping to update lasttime online
            setInterval(function() {
                $apiProvider.ping();
            }, 30000);
        }

        $scope.init = init = function () {
            if(!window.hasCallGlobalInit) {
                utils.log('Index:init:start');
                var userId = $.jStorage.get('__uid');
				//Temp setting
				//$.jStorage.set('__sid', '764819fd56f147fad3f3f');
				//$.jStorage.set('__uid', '19x338');
                
				var sessionId = $.jStorage.get('__sid');

                if (sessionId) {
                    $scope.setAuth(true);
                    initUser();
                    initTasks();
                } else {
                    utils.log('REQUIRE USER TO LOGIN');
                    $scope.openTabIndex('config');
                    return;
                }

                $(function(){
                    reloadUI();
                    initEvents();
                });

                registerStaticEvents();

                // Filter disabled module
                _.each($scope.tabsList, function(item) {
                    if(item.modules.length == 0) {
                        return true;
                    }

                    var hiddenCount = 0;
                    _.each(item.modules, function(module) {
                        if(empty(window.userdata.modules[module])) {
                            hiddenCount++;
                        }
                    });

                    if(item.modules.length <= hiddenCount) {
                        item.enable = 0;
                    } else {
                        item.enable = 1;
                    }
                });

                selectTab(guessTab);
                window.hasCallGlobalInit = true;
                utils.log('Index:init:end');
            }
        };

        $scope.initUser = initUser = function (callback) {
            window.netvillnav = {history: []};
            //Load use preferences

            var storageUserData = $.jStorage.get('userdata');
            if(!empty(storageUserData)) {
                window.userdata = storageUserData;
            } else {
                $apiProvider.getPreferences(function (result) {
                    if(result['success'] == 1) {
                        window.userdata = result;
                        $.jStorage.set('userdata', result);
                        if(callback) callback();
                    } else {
                        utils.handleError(result);
                        utils.hideLoading();
                    }
                });
            }
        };

        $scope.isSelectedTab = isSelectedTab = function (tabName) {
            return $scope.selectedTab === tabName;
        };

        $scope.openTabIndex = openTabIndex = function(tabName, callback) {
            utils.log('Index:openTab:index:'+tabName);

            $scope.selectedTab = tabName;
            if ($('.app-body .tab-' + tabName).length === 0) {
				alert("base selected tab => " + tabName)
                utils.showLoading('rendering page...');
                utils.downloadTemplate('app/views/' + tabName + '.html', function(tabHtml){
                    var template = angular.element(
                        '<div class="tab-content tab-' + tabName + '" ng-show="isSelectedTab(\'' + tabName + '\')" \
                        id="box_' + tabName + '">' + tabHtml + '</div>');

                    var linkFn = $compile(template);
                    var element = linkFn($scope);
                    $('.app-body').append(element);
                    $scope.safeApply();

                    //Add scroll handler for this tab
                    $('.tab-'+tabName).scroll(function() {
                        $scope.initScrollEvent(this);
                    });

                    //Refresh ui
                    reloadUI();
                    utils.hideLoading();


                    if(callback) {
                        callback();
                    }
                });
            } else {
                reloadUI();
                if(callback) {
                    callback();
                }
                $scope.safeApply();
            }
        };

        $scope.openTab = openTab = function(tabName, callback) {
            utils.log('Index:openTab:'+tabName);

            if (!isAuth()) {
                tabName = guessTab;
            }

            function checkAndLoadRefList(tabName) {
                // Trigger show related data
                var summaryScope = angular.element('#summary-container').scope();

                if(summaryScope == undefined) return;

                var summaryId = summaryData.id;
                var summaryType = summaryData.type;

                if(tabName == 'account') {
                    var focusScope = angular.element('#account-container').scope();
                    if(!empty(summaryId)) {
                        if(summaryType == 'Contacts') {
                            utils.showLoading();
                            $apiProvider.findRef(summaryType, summaryId, 'Accounts', function(result){
                                if(result.success) {
                                    if(result.record.account_id != '') {
                                        focusScope.enableShowDetail(result.record.account_id);
                                    } else {
                                        focusScope.setMode('index');
                                    }
                                } else {
                                    utils.handleError(result, summaryType);
                                    focusScope.setMode('index');
                                    focusScope.safeApply();
                                }

                                utils.hideLoading();
                            });
                        } else {
                            focusScope.setMode('no_applied_for_lead');
                        }
                    } else {
                        focusScope.setMode('index');
                    }
                } else if (tabName == 'potential') {
                    var focusScope = angular.element('#potential-container').scope();
                    if(!empty(summaryId)) {
                        if(summaryType == 'Contacts') {
                            utils.showLoading();
                            focusScope.focusObject = 'Potentials';
                            focusScope.enableShowRefList(summaryType, summaryId);
                        } else {
                            focusScope.setMode('no_applied_for_lead');
                        }
                    } else {
                        focusScope.setMode('index');
                    }
                } else if (tabName == 'ticket') {
                    var focusScope = angular.element('#ticket-container').scope();
                    if(!empty(summaryId)) {
                        if(summaryType == 'Contacts') {
                            utils.showLoading();
                            focusScope.focusObject = 'HelpDesk';
                            focusScope.enableShowRefList(summaryType, summaryId);
                        } else {
                            focusScope.setMode('no_applied_for_lead');
                        }
                    } else {
                        focusScope.setMode('index');
                    }
                } else if (tabName == 'quote') {
                    var focusScope = angular.element('#quote-container').scope();
                    if(!empty(summaryId)) {
                        if(summaryType == 'Contacts') {
                            utils.showLoading();
                            focusScope.focusObject = 'Quotes';
                            focusScope.enableShowRefList(summaryType, summaryId);
                        } else {
                            focusScope.setMode('no_applied_for_lead');
                        }
                    } else {
                        focusScope.setMode('index');
                    }
                } else if (tabName == 'invoice') {
                    var focusScope = angular.element('#invoice-container').scope();
                    if(!empty(summaryId)) {
                        if(summaryType == 'Contacts') {
                            utils.showLoading();
                            focusScope.focusObject = 'Invoice';
                            focusScope.enableShowRefList(summaryType, summaryId);
                        } else {
                            focusScope.setMode('no_applied_for_lead');
                        }
                    } else {
                        focusScope.setMode('index');
                    }
                } else if (tabName == 'calendar') {
                    var focusScope = angular.element('#calendar-container').scope();
                    if(!empty(summaryId)) {
                        utils.showLoading();
                        focusScope.focusObject = 'Calendar';
                        focusScope.enableShowRefList(summaryType, summaryId);
                    } else {
                        focusScope.setMode('index');
                    }
                } else if(tabName == 'person') {
                    var focusScope = angular.element('#person-container').scope();
                    if(summaryType != '' && summaryId != undefined && summaryId != '') {
                        utils.showLoading();
                        focusScope.enableShowDetail(summaryType, summaryId);
                    } else {
                        focusScope.setMode('index');
                    }
                }
            }

            $scope.selectedTab = tabName;
            if ($('.app-body .tab-' + tabName).length === 0) {
                alert("base app-body => " + tabName)
				if(tabName == 'config') tabName = 'index';
				utils.showLoading('rendering page...');
				utils.downloadTemplate('app/views/' + tabName + '.html', function(tabHtml){
                    var template = angular.element(
                        '<div class="tab-content tab-' + tabName + '" ng-show="isSelectedTab(\'' + tabName + '\')"' +
                        ' id="box_' + tabName + '">' + tabHtml + '</div>');

                    var linkFn = $compile(template);
                    var element = linkFn($scope);
                    $('.app-body').append(element);

                    //Add scroll handler for this tab
                    $('.tab-'+tabName).scroll(function() {
                        $scope.initScrollEvent(this);
                    });

                    var newScope = angular.element('#'+tabName+'-container').scope();
                    if(newScope) {
                        newScope.safeApply();
                        //Refresh ui
                        reloadUI();
                        utils.hideLoading();
                        if(callback) {
                            callback(newScope);
                            $scope.safeApply();
                        } else if(tabName == 'config'){
                            $scope.safeApply();
                        } else {
                            checkAndLoadRefList(tabName);
                            $scope.safeApply();
                        }

                    }
                });
            } else {
                reloadUI();
                if(callback) {
                    var newScope = angular.element('#'+tabName+'-container').scope();
                    callback(newScope);
                    if(!$scope.$$phase) $scope.safeApply();
                } else if(tabName == 'config'){
                    if(!$scope.$$phase) $scope.safeApply();
                } else {
                    checkAndLoadRefList(tabName);
                }
            }

            //Focus search input
            if(tabName == 'search') {
                setTimeout(function() {
                    $('#search-container .search-input').focus();
                }, 300);
            }
        };

        $scope.initScrollEvent = initScrollEvent = function(element) {
            var topOffset = $(element).scrollTop();
            var elementHeight = $(element).height();
            var topBar = $('.fixed-to-top');
            var bottomBar = $('.fixed-box-bottom');

            if(topOffset > 30) {
                topBar.addClass('pinned');
            } else {
                topBar.removeClass('pinned');
            }

            if(elementHeight + topOffset + 50 < element.scrollHeight) {
                bottomBar.addClass('pinned');
            } else {
                bottomBar.removeClass('pinned');
            }
        };

        $scope.selectTab = selectTab = function (tabName) {
            openTab(tabName);
        };

        $scope.setHeaderText = setHeaderText = function (text) {
            $scope.headerText = text;
        };

        $scope.isAuth = isAuth = function () {
            return $scope.auth;
        };

        $scope.setAuth = setAuth = function (status) {
            //$scope.auth = status;
			$scope.auth = true;
        };

        $scope.loadGuestTab = loadGuestTab = function() {
            selectTab(guessTab);
        };

        $scope.initDetailEvents = initDetailEvents = function() {
            $('.detail-section').tooltip({ selector: '.refer-tooltip'});
        };

        $scope.initSearchEvents = initSearchEvents = function() {
            $('#box_search').tooltip({ selector: '.refer-tooltip'});
        };

        $scope.checkPerson = checkPerson = function(email, callback) {
            var emailFields = {lead: [], contact: []};

            if(window.userdata.fields.Contacts != undefined) {
                _.each(window.userdata.fields.Contacts.Summary, function(block) {
                    _.each(block.items, function(field) {
                        if(field.name == 'email') {
                            emailFields.contact.push(field.name);
                        } else if(field.name == 'secondaryemail') {
                            emailFields.contact.push(field.name);
                        }
                    });
                });
            }

            if(window.userdata.fields.Leads != undefined) {
                _.each(window.userdata.fields.Leads.Summary, function(block) {
                    _.each(block.items, function(field) {
                        if(field.name == 'email') {
                            emailFields.lead.push(field.name);
                        } else if(field.name == 'secondaryemail') {
                            emailFields.lead.push(field.name);
                        }
                    });
                });
            }

            var emailFieldsB64 = $HELPER.base64_encode(JSON.stringify(emailFields));

            $apiProvider.summaryFind(email, emailFieldsB64, function(result){
                callback(result);
            });
        };

        $scope.createAndLinkEmail = function(emailData, callback) {
            var summaryData = window.summaryData;
            var summaryType = summaryData.type;
            var summaryId = summaryData.id;

            var firstThreadId = emailData.first_email;
            var firstThread = emailData.threads[firstThreadId];

            var sendData = {
                'activitytype': 'Emails',
                'assigned_user_id': window.userdata.user.vtiger_id,
                'subject': emailData.subject,
                'description': $HELPER.base64_encode($HELPER.utf8_encode(firstThread.content_html)),
                'from_email': firstThread.from_email,
                'saved_toid': firstThread.to,
                'ccmail': firstThread.cc,
                'bccmail': firstThread.bcc,
                'email_flag': 'SENT',
                '_timestamp': firstThread.timestamp,
                '_email_id': firstThreadId
            };

            console.warn('Content to save, ', sendData);

            $apiProvider.createEmail(summaryId, sendData, function(){
                if(!empty(callback)) callback();
            });
        };

        $scope.populatenetvillButtons = function(mailContent) {
            //Check email existing in vTiger
            var summaryId = window.summaryData.id;
            $apiProvider.checkEmailExistInvTiger(mailContent.first_email, summaryId, function(result) {
                var emailExist = result.exist;

                //Add link emails button into email detail
                var detailViewActionsContainer = $('.gH.acX');
                var linkEmailBtn =
                    $('<button class="link-email-vt"><span class="label-link">Linked</span><div class="vte-toolip">Link email</div></button>');
                if(emailExist) {
                    linkEmailBtn.addClass('linked');
                }
                detailViewActionsContainer.append(linkEmailBtn);
                linkEmailBtn.data('email_data', mailContent);
                linkEmailBtn.click(function() {
                    if($(this).hasClass('linked')) {
                        return false;
                    }
                    var btnEmailData = $(this).data('email_data');
                    var that = this;
                    $(that).addClass('onload');
                    $scope.createAndLinkEmail(btnEmailData, function() {
                        $(that).removeClass('onload').addClass('linked');
                    });
                });
            });
        };

        $scope.populatenetvillButtonOnCompose = function() {
            var linkEmailBtn =
                $('<button class="link-email-reply"><div class="vte-toolip vte-tooltip-reply">Link and send</div></button>');
            var replySendContainer = $('.gU.Up');

            replySendContainer.each(function(i, container) {
                if($(container).find('.link-email-reply').length == 0) {
                    var btn = linkEmailBtn.clone();
                    $(container).append(btn);
                    $(btn).click(function() {
                        window.appStatus.replyTrigger = true;
                        $(this).prev().find('[role="button"]').trigger('click');
                    });
                }
            });
        };

        $scope.performLinkEmailReplied = function(sendData) {
            var summaryData = window.summaryData;
            var summaryType = summaryData.type;
            var summaryId = summaryData.id;

            var emailId = sendData.data.rm;
            var composeId = sendData.data.composeid;
            if(empty(emailId)) {
                emailId = composeId;
            }
            var emailBody = sendData.data.body;
            var sendTo = sendData.data.to;
            var subject = sendData.data.subject;
            var cc = sendData.data.cc;
            var bcc = sendData.data.bcc;
            var fromEmail = $('.gb_kb').text();

            var sendData = {
                'activitytype': 'Emails',
                'assigned_user_id': window.userdata.user.vtiger_id,
                'subject': subject,
                'description': $HELPER.base64_encode($HELPER.utf8_encode(emailBody)),
                'from_email': fromEmail,
                'saved_toid': sendTo,
                'ccmail': cc,
                'bccmail': bcc,
                'email_flag': 'SENT',
                '_timestamp': (new Date()).getTime(),
                '_email_id': emailId
            };

            $apiProvider.createEmail(summaryId, sendData, function(){
                if(!empty(callback)) callback();
            });
        };

        function _initReferInputEvents() {
            //Init functions for refer field
            $('body').on('click', '.refer-input .slt-opt a', function (e) {
                e.preventDefault();
                var sltText = $(this).text();
                var sltValue = $(this).parent().data('opt-val');
                $(this).closest('.refer-input').find('.opt-val').text(sltText);
                $(this).closest('.refer-input').find('.opt-val').data('opt-val', sltValue);
            });

            $('body').on('keyup', '.refer-input .refer-val', function (e) {
                if(e.keyCode == 13) {
                    $(this).next().next().children('.btn-search').trigger('click');
                }
            });

            $('body').on('click', '.refer-input .btn-search', function () {
                var fieldName = $(this).data('field-name');
                var remoteContainer = $(this).closest('.refer-input');
                var popoverModule = remoteContainer.find('.opt-val').text();
                var focusObject = remoteContainer.find('.opt-val').attr('data-opt-val');
                var keyWord = $('#'+fieldName+'_display').val();

                remoteContainer.popover({
                    container: 'body',
                    placement: 'left',
                    title: 'Available ' + popoverModule,
                    trigger: 'manual',
                    template: '<div class="netvill-enable popover" role="tooltip"> \
                                <div class="arrow"></div> \
                                <div class="popover-header"> \
                                <h3 class="popover-title"></h3><a href="#" class="btn-close"><span class="glyphicon glyphicon-remove"></span></a></div> \
                                <div class="popover-content"></div> \
                                <div class="loading-popup"><span>Loading...</span></div> \
                                </div>'
                });

                remoteContainer.popover('show');

                var remoteId = remoteContainer.attr('aria-describedby');
                var container = $('#' + remoteId);
                var popupContent = container.find('.popover-content');
                popupContent.parent().find('.loading-popup').show();

                var nameField = '';
                if(focusObject == 'Accounts') {
                    nameField = '#{accountname}';
                } else if(focusObject == 'Contacts') {
                    nameField = '#{firstname} #{lastname}';
                } else if(focusObject == 'Users') {
                    nameField = '#{first_name} #{last_name}';
                } else if(focusObject == 'Groups') {
                    nameField = '#{groupname}';
                } else if(focusObject == 'Products') {
                    nameField = '#{productname}';
                } else if(focusObject == 'Potentials') {
                    nameField = '#{potentialname}';
                } else if(focusObject == 'Campaigns') {
                    nameField = '#{campaignname}';
                } else if(focusObject == 'Leads') {
                    nameField = '#{firstname} #{lastname}';
                } else if(focusObject == 'HelpDesk'){
                    nameField = '#{ticket_title}'
                } else {
                    utils.log(focusObject + ' is not define nameField for popup select', 'err');
                    return;
                }

                $apiProvider.search(focusObject, keyWord, 5, null, function(result){
                    if (result.success && result.length > 0) {
                        var itemsHtml = '';
                        $(result.result.data).each(function (i, o) {
                            itemsHtml += '<li><a class="slt-record" href="#" data-id="' + o.id + '">' + $.tmpl(nameField, o) + '</a></li>';
                        });
                        popupContent.html('<ul class="entity-list">' + itemsHtml + '</ul>');
                    } else {
                        popupContent.html('<div class="span-result">no results</div>');
                    }

                    if(!arrayContains(focusObject, ['Users', 'Groups'])) {
                        popupContent.append('<div><button data-for="'+focusObject+'" class="btn-new-entity btn btn-sm btn-success">Create new '+$lang.single(focusObject, true)+'</button></div>');
                    }

                    popupContent.parent().find('.loading-popup').hide();
                });
            });

            $('body').on('click', '.refer-input .btn-clear-refer', function () {
                $(this).prev().prev().val('');
                $(this).prev().prev().prev().val('');
                $(this).prev().prev().prev().focus();
            });

            $('body').on('click', '.popover .btn-close', function (e) {
                e.preventDefault();
                var remoteId = $(this).closest('.popover').attr('id');
                $('#' + remoteId).popover('hide');
            });

            $('body').on('click', '.popover .entity-list .slt-record', function (e) {
                e.preventDefault();
                var objectId = $(this).data('id');
                var objectName = $(this).text();
                var remoteId = $(this).closest('.popover').attr('id');
                var remoteContainer = $('.refer-input[aria-describedby="' + remoteId + '"]');
                remoteContainer.find('.refer-val').val(objectName);
                remoteContainer.find('.refer-val-id').val(objectId);
                remoteContainer.popover('hide');
            });

            $('body').on('click', '.btn-new-entity', function(e){
                e.preventDefault();

                var remoteId = $(this).closest('.popover').attr('id');
                var remoteContainer = $('.refer-input[aria-describedby="' + remoteId + '"]');
                var remoteCtrl = $(remoteContainer).closest('[ng-controller$="Ctrl"]');

                window.appStatus.creatingReturnTo = {
                    ctrlId: remoteCtrl.attr('id'),
                    displayField: remoteContainer.find('.refer-val'),
                    idField: remoteContainer.find('.refer-val-id'),
                };

                var forModule = $(this).data('for');
                var remoteId = $(this).closest('.popover').attr('id');
                $('#' + remoteId).popover('hide');
                if(forModule == 'Accounts') {
                    $scope.openTab('account', function(){
                        var focusCtrl = angular.element('#account-container').scope();
                        focusCtrl.showCreateArea();
                        setTimeout(function(){
                            $(".tab-content").animate({ scrollTop: 0 }, "fast");
                        }, 500);
                    });
                } else if(forModule === 'Contacts' || forModule === 'Leads') {
                    $scope.openTab('person', function(){
                        var focusCtrl = angular.element('#person-container').scope();
                        focusCtrl.showCreateArea(forModule);
                        setTimeout(function(){
                            $(".tab-content").animate({ scrollTop: 0 }, "fast");
                        }, 500);
                    });
                }

            });

            $('body').on('click', '.reference-record', function() {
                var recordId = $(this).data('id');
                var type = $(this).data('type');
                var remoteContainer = $(this).parent();

                remoteContainer.popover({
                    container: 'body',
                    //container: '#netvill_ext',
                    placement: 'left',
                    title: $scope.trans('SINGLE_' + type) + ' details',
                    trigger: 'manual',
                    template:
                        '<div class="netvill-enable popover" role="tooltip"> \
                            <div class="arrow"></div> \
                                <div class="popover-header"> \
                                    <h3 class="popover-title"></h3> \
                                        <a href="#" class="btn-close"> \
                                        <span class="glyphicon glyphicon-remove"></span> \
                                    </a> \
                                </div> \
                            <div class="popover-content popup-detail"> \
                                <div ng-controller="PopupDetailCtrl"></div> \
                            </div> \
                            <div class="loading-popup"><span>Loading...</span></div> \
                        </div>'
                });

                remoteContainer.popover('show');

                var remoteId = remoteContainer.attr('aria-describedby');
                var container = $('#' + remoteId);
                var popupContent = container.find('.popover-content');
                popupContent.next().show();

                // Download popup template
                utils.downloadTemplate('app/views/general/popup-detail.html', function(sectionHtml) {
                    var template = angular.element(sectionHtml);
                    var linkFn = $compile(template);
                    var element = linkFn($scope);
                    popupContent.html(element);
                    $scope.safeApply();
                    angular.element(popupContent).find('[ng-controller="PopupDetailCtrl"]').scope()
                        .setRecord(type, recordId, function(){
                            popupContent.next().hide();
                        });
                });
            });
        }

        function _initLineItemEvents() {
            function renderDataTable(relModule, result, updateItemOnly, focusModule) {
                updateItemOnly = updateItemOnly || false;

                function renderRows(o) {
                    return '<tr> \
                                <td> \
                                    <a class="slt-record" href="#" data-id="' + o.id + '" data-data=\''+JSON.stringify(o)+'\'>' + o.itemname + '</a> \
                                </td> \
                                <td> \
                                    <span class="item-price">'+ $HELPER.formatValue('currency', o.unit_price)+'</span> \
                                </td> \
                            </tr>';
                }

                if(!updateItemOnly) {
                    if (result.success && result.total_count > 0) {
                        var totalPages = Math.ceil(result.total_count / 7);
                        var searchFormUI = '<form method="post" class="listview-search-form" data-rel-module="'+relModule+'" data-focus-module="'+focusModule+'"> \
                                                <div class="input-group"> \
                                                    <input type="text" class="form-control input-sm listview-filter-value" placeholder="Name..."> \
                                                    <span class="input-group-btn"> \
                                                        <button class="btn btn-primary btn-sm" type="submit">Find</button> \
                                                    </span> \
                                                </div> \
                                            </form>';

                        var dataTable = '<table class="entity-table-list table table-striped" data-rel-module="'+relModule+'" data-page="1" data-total-page="'+totalPages+'">';

                        dataTable += '<thead><tr> \
                                        <th><span class="column-header-text">Item Name</span></th> \
                                        <th><span class="column-header-text">Price</span></th> \
                                    </tr></thead><tbody>';

                        $(result.result).each(function (i, o) {
                            dataTable += renderRows(o);
                        });

                        dataTable += '</tbody></table>';

                        var navigation = '<div class="listview-nav"> \
                                            <div class="listview-nav-items pull-right"> \
                                                <button class="listview-prev btn btn-sm btn-default" data-rel-module="'+relModule+'" data-focus-module="'+focusModule+'"><i class="fa fa-chevron-left"></i></button> \
                                                <span class="listview-page-numbers">1/'+totalPages+'</span> \
                                                <button class="listview-next btn btn-sm btn-default" data-rel-module="'+relModule+'" data-focus-module="'+focusModule+'"><i class="fa fa-chevron-right"></i></button> \
                                            </div> \
                                        </div>';

                        return searchFormUI + dataTable + navigation;
                    } else {
                        return '<div class="span-result">no results</div>';
                    }
                } else {
                    var lineItem = '';
                    $(result.result).each(function (i, o) {
                        lineItem += renderRows(o);
                    });
                    return lineItem;
                }
            }

            // Add line item
            $('body').on('click', '.inventory-add-item', function(e) {
                var rel = $(this).attr('rel');
                var remoteContainer = $(this);
                var module = rel == 'product' ? 'Products' : 'Services';
                var relModule = $(this).attr('rel_module');

                remoteContainer.popover({
                    container: 'body',
                    placement: 'top',
                    title: 'Select ' + module,
                    trigger: 'manual',
                    template: '<div class="netvill-enable popover" role="tooltip"> \
                                <div class="arrow"></div> \
                                    <div class="popover-header"> \
                                    <h3 class="popover-title"></h3><a href="#" class="btn-close"><span class="glyphicon glyphicon-remove"></span></a></div> \
                                    <div class="popover-content"></div> \
                                    <div class="loading-popup"><span>Loading...</span></div> \
                                </div>'
                });

                remoteContainer.popover('show');

                var remoteId = remoteContainer.attr('aria-describedby');
                var container = $('#' + remoteId);
                var popupContent = container.find('.popover-content');
                popupContent.parent().find('.loading-popup').show();

                if(rel == 'product') {
                    $apiProvider.searchProductByName('', 7, 1, function(result) {
                        var ui = renderDataTable(relModule, result, false, module);
                        popupContent.html(ui);
                        popupContent.parent().find('.loading-popup').hide();
                    });
                }
                else if(rel == 'service') {
                    $apiProvider.searchServiceByName('', 7, 1, function(result) {
                        var ui = renderDataTable(relModule, result, false, module);
                        popupContent.html(ui);
                        popupContent.parent().find('.loading-popup').hide();
                    });
                }
            });

            $('body').on('click', '.listview-next', function() {
                var that = this;
                var tableList = $(this).closest('.listview-nav').prev();
                var currentPage = tableList.data('page');
                var totalPage = tableList.data('total-page');
                var pageNumberView = $(this).closest('.listview-nav').find('.listview-page-numbers');
                var nextPage = false;
                var relModule = $(this).data('rel-module');
                var module = $(this).data('focus-module');

                if(currentPage < totalPage) {
                    nextPage = currentPage + 1;
                    //$(this).removeClass('invisible');
                }

                if(nextPage) {
                    var searchValue = tableList.prev().find('.listview-filter-value').val();
                    $(this).prop('disabled', true);

                    if(module == 'Products') {
                        $apiProvider.searchProductByName(searchValue, 7, nextPage, function(result) {
                            if(result.success && result.total_count > 0) {
                                var totalPages = Math.ceil(result.total_count / 7);
                                var dataItem = renderDataTable(relModule, result, true, module);
                                tableList.children('tbody').html(dataItem);
                                tableList.data('page', nextPage);
                                tableList.data('total-page', totalPages);
                                pageNumberView.html(nextPage + '/' + totalPages);
                            }
                            $(that).prop('disabled', false);
                        });
                    } else if(module == 'Services') {
                        $apiProvider.searchServiceByName(searchValue, 7, nextPage, function(result) {
                            if(result.success && result.total_count > 0) {
                                var totalPages = Math.ceil(result.total_count / 7);
                                var dataItem = renderDataTable(relModule, result, true, module);
                                tableList.children('tbody').html(dataItem);
                                tableList.data('page', nextPage);
                                tableList.data('total-page', totalPages);
                                pageNumberView.html(nextPage + '/' + totalPages);
                            }
                            $(that).prop('disabled', false);
                        });
                    }

                    if(nextPage + 1 > totalPage) {
                        //$(this).addClass('invisible');
                    } else {
                        //$(this).removeClass('invisible');
                    }
                }
            });

            $('body').on('click', '.listview-prev', function() {
                var that = this;
                var tableList = $(this).closest('.listview-nav').prev();
                var currentPage = tableList.data('page');
                var pageNumberView = $(this).closest('.listview-nav').find('.listview-page-numbers');
                var prevPage = false;
                var relModule = $(this).data('rel-module');
                var module = $(this).data('focus-module');

                if(currentPage > 1) {
                    prevPage = currentPage - 1;
                    //$(this).removeClass('invisible');
                }

                if(prevPage) {
                    var searchValue = tableList.prev().find('.listview-filter-value').val();
                    $(this).prop('disabled', true);

                    if(module == 'Products') {
                        $apiProvider.searchProductByName(searchValue, 7, prevPage, function(result) {
                            if(result.success && result.total_count > 0) {
                                var totalPages = Math.ceil(result.total_count / 7);
                                var dataItem = renderDataTable(relModule, result, true, module);
                                tableList.children('tbody').html(dataItem);
                                tableList.data('page', prevPage);
                                tableList.data('total-page', totalPages);
                                pageNumberView.html(prevPage + '/' + totalPages);
                            }
                            $(that).prop('disabled', false);
                        });
                    } else if(module == 'Services') {
                        $apiProvider.searchServiceByName(searchValue, 7, prevPage, function(result) {
                            if(result.success && result.total_count > 0) {
                                var totalPages = Math.ceil(result.total_count / 7);
                                var dataItem = renderDataTable(relModule, result, true, module);
                                tableList.children('tbody').html(dataItem);
                                tableList.data('page', prevPage);
                                tableList.data('total-page', totalPages);
                                pageNumberView.html(prevPage + '/' + totalPages);
                            }
                            $(that).prop('disabled', false);
                        });
                    }

                    if(prevPage - 1 == 1) {
                        //$(this).addClass('invisible');
                    } else {
                        //$(this).removeClass('invisible');
                    }
                }
            });

            $('body').on('submit', '.listview-search-form', function(e){
                e.preventDefault();
                var tableList = $(this).next();
                var pageNumberView = $(this).next().next().find('.listview-page-numbers');
                var relModule = $(this).data('rel-module');
                var module = $(this).data('focus-module');

                var searchValue = tableList.prev().find('.listview-filter-value').val();

                if(module == 'Products') {
                    $apiProvider.searchProductByName(searchValue, 7, 1, function(result) {
                        if(result.success && result.total_count > 0) {
                            var totalPages = Math.ceil(result.total_count / 7);
                            var dataItem = renderDataTable(relModule, result, true, module);
                            tableList.children('tbody').html(dataItem);
                            tableList.data('page', 1);
                            tableList.data('total-page', totalPages);
                            pageNumberView.html(1 + '/' + totalPages);
                        }
                    });
                } else if(module == 'Services') {
                    $apiProvider.searchServiceByName(searchValue, 7, 1, function(result) {
                        if(result.success && result.total_count > 0) {
                            var totalPages = Math.ceil(result.total_count / 7);
                            var dataItem = renderDataTable(relModule, result, true, module);
                            tableList.children('tbody').html(dataItem);
                            tableList.data('page', 1);
                            tableList.data('total-page', totalPages);
                            pageNumberView.html(1 + '/' + totalPages);
                        }
                    });
                }
            });

            $('body').on('click', '.entity-table-list .slt-record', function() {
                var productData = $(this).data('data');
                var containerTable = $(this).closest('.entity-table-list');
                var relModule = containerTable.data('rel-module');
                var focusController = angular.element('.'+relModule+'-container').scope();
                focusController.addItem(productData);
            });
        }

        function initEvents() {
            _initReferInputEvents();
            _initLineItemEvents();
        }

        function registerStaticEvents() {
            var composeWindows = $('.M9');
            if(composeWindows.length > 0) {
                $scope.populatenetvillButtonOnCompose();
            }
        }

        $scope.reloadUI = reloadUI = function() {
            utils.log("Call reloadUI");
            $('.btn-collapse-app').tooltip();

            $('input.dropdown-field').each(function (i, o) {
                setTimeout(function () {
                    var multiple = $(o).data('multiple');
                    var opt = {
                        placeholder: "",
                        allowClear: true,
                        data: $(o).data('options'),
                        container: '#netvill_ext',
                        separator: ' |##| '
                    };

                    if(multiple) {
                        opt['multiple'] = multiple;
                        opt['closeOnSelect'] = false;
                    }

                    var select2Ctrl = $(o).select2(opt);
                    if($(select2Ctrl).hasClass('opt-search-for')) {
                        window.searchOptionsCtrl = select2Ctrl;
                    }
                });
            });

            if(!empty(window.userdata)) {
                var userDateFormat = userdata.user.date_format;
                $('.date-field').datepicker({
                    format: userDateFormat
                }).on('changeDate', function(ev){
                    $(this).datepicker('hide');
                });
            }

            $('body').on('click', '.datepicker-add-on', function () {
                $(this).closest('.input-group').find('.date-field').trigger('focus');
            });

            $('.time-field').timepicker({ timeFormat: 'h:i A' });

            $('.time-field').on('changeTime', function() {
                $(this).val($(this).attr('value'));
            });

            if(!empty(window.userdata)) {
                $('.currency-field').maskMoney({
                    thousands: userdata.user.currency_grouping_separator,
                    decimal: userdata.user.currency_decimal_separator
                });
            }

            $('body').on('click', '.timepicker-add-on', function () {
                $(this).closest('.input-group').find('.time-field').trigger('focus');
            });

            $('body').on('change', '.datetime-group .date-field', function() {
                var input = $(this).closest('.datetime-group').children('.datetime-field-value');
                var timeField = $(this).closest('.datetime-group').find('.time-field');
                input.val($(this).val() + ' ' + timeField.val());
            });

            $('body').on('change', '.datetime-group .time-field', function() {
                var input = $(this).closest('.datetime-group').children('.datetime-field-value');
                var dateField = $(this).closest('.datetime-group').find('.date-field');
                input.val(dateField.val() + ' ' + $(this).val());
            });

            $('.taxmode').select2();

            $('body').on('click', '.reference-type-select', function() {
                var currDataOptVal = $(this).parent().attr('data-opt-val');
                $(this).closest('.slt-opt').prev().find('.opt-val').attr('data-opt-val', currDataOptVal);
            });

            $('body').addClass('netvill-popover');
            $('body').addClass('netvill-icon');
        }
    }]);

})(jQuery, window.Apploader, window.UTILS, window.PROPS, window.VTEHelperInstance);