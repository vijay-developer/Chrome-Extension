(function($, utils){
    window.OutlookHelper = {
        objects: {},
        api: function(name) {
            if(OutlookHelper.objects['_'+name] != undefined) {
                return OutlookHelper.objects['_'+name];
            } else {
                var obj = OutlookHelper['_'+name]();
                OutlookHelper.objects['_'+name] = obj;
                return obj;
            }
        },
        _mail: function() {
            var MailFactory = function() {};

            MailFactory.prototype.props = {
                timeCheckFocus: 100,
                viewMode: {
                    CONVERSATION: 'conversation',
                    ITEM: 'item'
                }
            };

            MailFactory.prototype.__getMasterEmailAddress = function() {
                var masterEmailAddress = $.cookie('DefaultAnchorMailbox');
                return masterEmailAddress;
            };

            MailFactory.prototype.__getCurrentViewMode = function() {
                return $($($('.conductorContent').get(3)).children('div').get(1)).attr('aria-label').trim();
            };

            MailFactory.prototype.__parseEmailAddress = function(originalContent) {
                if(originalContent.indexOf('<') !== -1) {
                    var nameComs = originalContent.split('<');
                    var name = nameComs[0].trim();
                    var email = nameComs[1].replace('>', '').trim();
                    return {name: name, email: email};
                } else if(originalContent.indexOf('@') !== -1) {
                    return {name: false, email: originalContent.replace(';', '')};
                } else {
                    if(originalContent != '')
                        return {name: originalContent.replace(';', ''), email: this.__getMasterEmailAddress()};
                }

                return false;
            };

            MailFactory.prototype.parseMessageContent = function(contentContainer) {
                var $T = this;
                var d = $.Deferred();
                contentContainer = $(contentContainer);

                var message = {
                    isOpening: false,
                    isFocusing: false,
                    subject: false,
                    fromName: false,
                    fromEmail: false,
                    to: [],
                    cc: [],
                    sentTime: false,
                    receivedTime: false,
                    summaryContent: false,
                    fullContent: false
                };

                if($T.__getCurrentViewMode() == $T.props.viewMode.CONVERSATION) {
                    // Get open state
                    //Collapsed Message Contents
                    var explandedRegion = contentContainer.children('div').children('div').first();
                    var collapsedRegion = contentContainer.children('div').children('div').get(1);
                    var readingPageContainer = jQuery('.conductorContent').last();
                    message.isOpening = explandedRegion.css('display') == 'block';

                    // Scan for email subject
                    message.subject = readingPageContainer.find('[role="heading"]').first().text();

                    if(message.isOpening) {
                        var headerContainer = explandedRegion.find('[role="heading"]').first();
                        console.warn('headerContainer', headerContainer);
                        var senderLabel = headerContainer.find('[id="ItemHeader.SenderLabel"]');
                        var toContainer = headerContainer.find('[id="ItemHeader.ToContainer"]');
                        var ccContainer = headerContainer.find('[id="ItemHeader.CcContainer"]');
                        //var folderContainer = headerContainer.find('._rp_b2');
                        var fromAddress = headerContainer.find('[id="ItemHeader.SenderLabel"]').text().trim();

                        //_pe_h _pe_u _pe_q1 bidi _pe_T

                        fromAddress = this.__parseEmailAddress(fromAddress);
                        message.fromName = fromAddress.name;
                        message.fromEmail = fromAddress.email;

                        // Scanner to addresses
                        toContainer.find('span.allowTextSelection').each(function(i, toElement) {
                            var toAddress = $(toElement).find('._pe_h._pe_u._pe_q1').text();
                            var toAddressParsed = $T.__parseEmailAddress(toAddress);
                            message.to.push(toAddressParsed);
                        });

                        // Scanner cc addresses
                        ccContainer.find('span.allowTextSelection').each(function(i, ccElement) {
                            var ccAddress = $(ccElement).find('._pe_h._pe_u._pe_q1').text();
                            var ccAddressParsed = $T.__parseEmailAddress(ccAddress);
                            message.cc.push(ccAddressParsed);
                        });

                        message.fullContent = $('[id="Item.MessageUniqueBody"]').html();
                        message.plainText = $('[id="Item.MessageUniqueBody"]').text();
                        message.sentTime = headerContainer.find('[id="ItemHeader.DateSentLabel"]').text();
                        message.receivedTime = headerContainer.find('[id="ItemHeader.DateReceivedLabel"]').last().text();

                        console.warn('Curren message is ', message);

                        //if(folderContainer.length > 0 && folderContainer.css('display') == 'block') {
                        //    message.isFocusing = true;
                        //}

                        //Generate message id
                        var messageId = md5(message.fromEmail + message.receivedTime + message.fullContent.trim().substring(0, 10));
                        message.id = messageId;

                        contentContainer.attr('email-id', messageId);
                    }

                    if(!empty(message.fromEmail)) {
                        d.resolve(message);
                    } else {
                        d.reject();
                    }

                    console.warn('message is ', message);
                } else {
                    var readingPageContainer = $('.conductorContent').last();

                    // Scan for email subject
                    message.subject = readingPageContainer.find('[role="heading"]').first().text();

                    var senderLabel = readingPageContainer.find('[id="ItemHeader.SenderLabel"]');
                    var toContainer = readingPageContainer.find('[id="ItemHeader.ToContainer"]');
                    var ccContainer = readingPageContainer.find('[id="ItemHeader.CcContainer"]');
                    var fromAddress = readingPageContainer.find('[id="ItemHeader.SenderLabel"]').text().trim();

                    //console.warn('fromAddress', fromAddress);

                    fromAddress = this.__parseEmailAddress(fromAddress);
                    //console.warn('FROM ADDRESS IS ', fromAddress);
                    message.fromName = fromAddress.name;
                    message.fromEmail = fromAddress.email;

                    // Scanner to addresses
                    toContainer.find('span.allowTextSelection').each(function(i, toElement) {
                        var toAddress = $(toElement).find('._pe_h._pe_u._pe_q1').text();
                        var toAddressParsed = $T.__parseEmailAddress(toAddress);
                        message.to.push(toAddressParsed);
                    });

                    // Scanner cc addresses
                    ccContainer.find('span.allowTextSelection').each(function(i, ccElement) {
                        var ccAddress = $(ccElement).find('._pe_h._pe_u._pe_q1').text();
                        var ccAddressParsed = $T.__parseEmailAddress(ccAddress);
                        message.cc.push(ccAddressParsed);
                    });

                    message.fullContent = readingPageContainer.find('.itemPartBody').next().next().children().children(':nth(1)').children(':nth(0)').children().html();
                    message.plainText = readingPageContainer.find('.itemPartBody').next().next().children().children(':nth(1)').children(':nth(0)').children().text();
                    message.sentTime = readingPageContainer.find('[id="ItemHeader.DateSentLabel"]').text();
                    message.receivedTime = readingPageContainer.find('[id="ItemHeader.DateReceivedLabel"]').last().text();

                    //if(folderContainer.length > 0 && folderContainer.css('display') == 'block') {
                    //    message.isFocusing = true;
                    //}

                    //Generate message id
                    var messageId = md5(message.fromEmail + message.receivedTime + message.fullContent.trim().substring(0, 10));
                    message.id = messageId;

                    contentContainer.attr('email-id', messageId);

                    if(!empty(message.fromEmail)) {
                        d.resolve(message);
                    } else {
                        d.reject();
                    }
                    console.warn('message is ', message);

                }

                return d.promise();
            };

            MailFactory.prototype.getDisplayingMessages = function () {
                var $T = this;
                var messages = [];
                var d = $.Deferred();

                $T.getFocusingMessageContainer().then(function() {
                    var contentContainers = $T.__getAllMessageContainers();

                    contentContainers.children().children().each(function(idx, contentContainer) {
                        $T.parseMessageContent(contentContainer).then(function(message){
                            messages.push(message);
                        });
                    });

                    d.resolve(messages);
                });

                return d.promise();
            };

            MailFactory.prototype.__getMailActionContainer = function(messageContainer) {
                return $(messageContainer).find('[id="ItemHeader.SenderLabel"]').next();
            };

            MailFactory.prototype.__getAllMessageContainers = function() {
                var readingPageContainer = jQuery('.conductorContent').last();
                return readingPageContainer.find('[role="list"]').children().children();
            };

            MailFactory.prototype.getFocusingMessageContainer = function() {
                var $T = this;
                var d = $.Deferred();

                // Scanner for conversation view mode
                if($T.__getCurrentViewMode() == $T.props.viewMode.CONVERSATION) {
                    var conversationContainers = $T.__getAllMessageContainers();

                    var found = false;
                    conversationContainers.each(function(cIdx, cO) {
                        var expandedBlock = $(cO).children('div').children('div').first();
                        if(//Is visible
                        $(expandedBlock).css('display') == 'block'
                            //Is not draft
                        && $T.__getMailActionContainer(cO).length > 0
                        && $T.__getMailActionContainer(cO).parent().parent().css('display') == 'block'
                        && $T.__getMailActionContainer(cO).children('div:eq(1)').hasClass('hidden')) {
                            found = true;
                            d.resolve(cO);
                        }
                    });

                    if(!found) {
                        d.reject();
                    }
                }

                // Scanner for item view mode
                else {
                    var readingPageContainer = $('.conductorContent').last();
                    var messageContainer = readingPageContainer.find('[role="region"]')[0];
                    d.resolve(messageContainer);
                }

                return d.promise();
            };

            MailFactory.prototype.getFocusingMessageData = function() {
                var $T = this;
                var d = $.Deferred();

                this.getFocusingMessageContainer().then(function(messageContainer) {
                    $T.parseMessageContent(messageContainer).then(function(messageData) {
                        d.resolve(messageData);
                    });
                });

                return d.promise();
            };

            return new MailFactory();
        },

        _event: function() {
            var MailEventListener = function() {};

            MailEventListener.prototype.props = {
                selectedMessage: false,
                selectedMessageId: false,
                timeCheckThreadChanging: 1200,
                timeCheckReplyComposerDisplay: 500,
                replyComposerOpening: false
            };

            MailEventListener.prototype.handlers = {
                email_open: [],
                reply_open: []
            };

            MailEventListener.prototype.listen = function() {
                var $T = this;

                setInterval(function() {
                    // CONVERSATION VIEW
                    if(OutlookHelper.api('mail').__getCurrentViewMode() == OutlookHelper.api('mail').props.viewMode.CONVERSATION) {
                        OutlookHelper.api('mail').getFocusingMessageContainer().then(function(selectedMessageContainer) {
                            if($T.props.selectedMessage !== selectedMessageContainer) {
                                $T.props.selectedMessage = selectedMessageContainer;
                                // Call delegate
                                _.each($T.handlers.email_open, function(handler) {
                                    OutlookHelper.api('mail').getFocusingMessageData().then(function(focusingEmailData) {
                                        handler.call(this, focusingEmailData);
                                    });
                                });
                            }
                        });
                    }

                    // ITEM VIEW
                    else {
                        OutlookHelper.api('mail').getFocusingMessageContainer().then(function(selectedMessageContainer) {
                            var selectedMessageId = $(selectedMessageContainer).attr('email-id');

                            if(empty(selectedMessageId) || selectedMessageId != $T.props.selectedMessageId) {
                                //console.warn(selectedMessageId ,'|', $T.props.selectedMessageId);

                                // Call delegate
                                _.each($T.handlers.email_open, function(handler) {
                                    OutlookHelper.api('mail').getFocusingMessageData().then(function(focusingEmailData) {
                                        $T.props.selectedMessageId = focusingEmailData.id;
                                        handler.call(this, focusingEmailData);
                                    });
                                });
                            }
                        });
                    }

                    // Listen for reply compose opening
                    var composerElement = $('._mcp_31._mcp_51._mcp_41');
                    if(composerElement.length > 0) {
                        if(!$T.props.replyComposerOpening) {
                            // Call delegate
                            _.each($T.handlers.reply_open, function(handler) {
                                handler.call(this, composerElement);
                            });
                            $T.props.replyComposerOpening = true;
                        }
                    } else {
                        $T.props.replyComposerOpening = false;
                    }
                }, $T.props.timeCheckThreadChanging);

            };

            MailEventListener.prototype.openEmail = function(handler) {
                this.handlers.email_open.push(handler);
            };

            MailEventListener.prototype.replyComposerOpen = function(handler) {
                this.handlers.reply_open.push(handler);
            };

            return new MailEventListener();
        }
    };

    OutlookHelper.api('event').listen();
})(jQuery, UTILS);