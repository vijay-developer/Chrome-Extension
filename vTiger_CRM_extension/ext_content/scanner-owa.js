(function (utils, $) {

    function Scanner() {
        var thatScanner = this;

        this.handlers = {
            onEmailOpen: function (focusingMessage, mailActionContainer) {
                // Check if corrensa button exist then remove it
                if($('.link-email-vt').length > 0) {
                    $('.link-email-vt').remove();
                }

                var focusThreadFrom = {
                    name: focusingMessage.fromName,
                    email: focusingMessage.fromEmail ? focusingMessage.fromEmail : ''
                };

                // Get last thread
                var phone = focusingMessage.fullContent.match(/([0-9\)\(\+\-\.\s]{10,25})/gi);
                if(phone !== null) {
                    focusThreadFrom.phone = _.last(phone).trim();
                } else {
                    focusThreadFrom.phone = '';
                }

                //Check phone number again
                var numbCount = 0;
                for(var i = 0; i < focusThreadFrom.phone.length; i++) {
                    if(!isNaN(focusThreadFrom.phone.charAt(i)))
                        numbCount++;
                }
                if(numbCount < 10) {
                    focusThreadFrom.phone = '';
                }

                if(empty(focusThreadFrom.email)) {
                    return;
                }

                window.initPerson = focusThreadFrom;
                var indexScope = angular.element('#index-container').scope();

                utils.showLoading('Looking for "'+focusThreadFrom.name+'" ...');

                function callCheckPerson() {
                    if(indexScope == undefined) {
                        setTimeout(function() {
                            callCheckPerson();
                        }, 1000);

                        return;
                    }

                    if(!indexScope.isAuth()) {
                        utils.hideLoading();
                        return;
                    }

                    window.summaryData = false;

                    utils.log("Call check person");
                    indexScope.checkPerson(focusThreadFrom.email, function(result) {
                        utils.log("Check person result");
                        utils.log(result);

                        window.appStatus.selectedEmail = true;

                        indexScope.openTab('summary', function() {
                            var summaryScope = angular.element('#summary-container').scope();
                            if(result.success) {
                                utils.log('Call ' + result.type + ' - ' + result.record.id);
                                summaryScope.enableShowDetail(result.type, result.record.id, function(){
                                    indexScope.headerText = result.record.firstname + ' ' + result.record.lastname;
                                    window.indexCtrl.populateCorrensaButtons(focusingMessage);
                                });
                            } else {
                                //Clear header text
                                indexScope.headerText = 'New Record';

                                // Call error handler
                                utils.handleError(result);

                                // Show summary index
                                if(summaryScope) summaryScope.mode = 'index';

                                if(result.msg == 'AUTHENTICATION_FAILURE') {
                                    indexScope.openTabIndex('config');
                                } else {
                                    indexScope.openTabIndex('summary');
                                }

                                if(window.personCtrl != undefined) {
                                    personCtrl.setMode('index');
                                    personCtrl.safeApply();
                                }

                                utils.hideLoading();
                            }
                        });
                    });
                }

                callCheckPerson();
            },

            onReplyComposerOpen: function(composerContainer) {
                var indexCtrl = angular.element('#index-container').scope();
                indexCtrl.populateCorrensaButtonOnCompose();
            }
        };

        this.initEvents = function () {
            var $T = this;
            OutlookHelper.api('event').openEmail($T.handlers.onEmailOpen);
            OutlookHelper.api('event').replyComposerOpen($T.handlers.onReplyComposerOpen);
        };


        this.firstTimeOpenCheck = null;

        this.loadGmailSDK = loadGmailSDK = function (script) {
            window.parent.postMessage({action: 'execScript', src: script}, '*');
        };

        this.listenCrossWindowActions = listenCrossWindowActions = function (handlers) {
            window.addEventListener("message", function (sender) {
                if (sender.data.from == 'out') {
                    for (var fnName in handlers) {
                        var handler = handlers[fnName];
                        if (fnName === sender.data.action) {
                            handler(sender.data);
                        }
                    }
                }
            }, false);
        };

        this.load = load = function () {
            var that = this;
            utils.downloadResource(
                ['libs/jquery.min.js', 'libs/gmail.js', 'libs/gmail-adapter.js'], function (content) {
                    that.loadGmailSDK(content);
                    that.listenCrossWindowActions({
                        'callFnc_Return': function (data) {
                            //Each case is a task
                            switch (data.fnName) {
                                case 'getGmailId':
                                    console.log('callFnc return');
                                    console.log(data.result);
                                    break;

                                case 'actionForUpdateCorrensaBtn':
                                    var mailContent = data.result.mailContent;
                                    indexCtrl.populateCorrensaButtons(mailContent);
                                    break;

                                case 'actionForEmailOpening':

                                    break;
                                case 'actionForCheckCurrentPage':
                                    utils.log("Length of hidden elements " + $('#loading:hidden').length);
                                    window.gmailLoaded = true;
                                    if ($('#loading:hidden').length > 0) {
                                        utils.log('dom loaded');
                                        var currentPage = data.result.currentPage;
                                        if (currentPage == null) {
                                            callGmailMethod('actionForEmailOpening');
                                            clearInterval(thatScanner.firstTimeOpenCheck);
                                        } else {
                                            clearInterval(thatScanner.firstTimeOpenCheck);
                                        }
                                    } else {
                                        utils.log('still waiting to checking person');
                                    }

                                    break;
                                case 'actionForOpenInbox':
                                    break;
                            }
                        },
                        'fireEvent': function (data) {
                            switch (data.eventType) {
                                case 'open_email':
                                    utils.log('An email has been opened');
                                    var indexCtrl = angular.element('#index-container').scope();
                                    if (indexCtrl.isAuth()) {
                                        callGmailMethod('actionForEmailOpening');
                                    }
                                    break;
                                case 'open_inbox':
                                    utils.log('Inbox has been opened');

                                    var indexCtrl = angular.element('#index-container').scope();
                                    if (indexCtrl.isAuth()) {
                                        callGmailMethod('actionForOpenInbox');
                                    }
                                    break;
                                case 'compose_open':
                                    var indexCtrl = angular.element('#index-container').scope();
                                    indexCtrl.populateCorrensaButtonOnCompose();
                                    break;
                                case 'send_message':
                                    if (window.appStatus.replyTrigger) {
                                        var indexCtrl = angular.element('#index-container').scope();
                                        indexCtrl.performLinkEmailReplied(data.send_data);
                                        window.appStatus.replyTrigger = false;
                                    }
                                    break;
                            }
                        }
                    });
                });
        };

        this.callGmailMethod = callGmailMethod = function (fn, params) {
            window.parent.postMessage({action: 'callFnc', fnName: fn, fnParams: params, from: 'in'}, '*');
        };

        this.checkCurrentPage = checkCurrentPage = function () {
            thatScanner.firstTimeOpenCheck = setInterval(function () {
                callGmailMethod('actionForCheckCurrentPage');
            }, 500);
        };

        this.updateCorrensaBtn = function () {
            callGmailMethod('actionForUpdateCorrensaBtn');
        };
    }

    window.Scanner = new Scanner();
    window.Scanner.initEvents();
    //window.Scanner.checkCurrentPage();
})(UTILS, jQuery);