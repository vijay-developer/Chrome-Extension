(function ($, apploader, utils, props, $HELPER) {
    var $app = window.netvill;
    // Define main controller
    $app.controller('IndexCtrl', ['$scope', '$rootScope', '$compile', 'apiProvider', 'lang', '$controller', function ($scope, $rootScope, $compile, $apiProvider, $lang,$controller) {

        $.extend(this, $controller('BaseIndexCtrl', {$scope: $scope}));

        $scope.createAndLinkEmail = function (emailData, callback) {
            var summaryData = window.summaryData;
            var summaryType = summaryData.type;
            var summaryId = summaryData.id;

            var sendTo = [];
            _.each(emailData.to, function(item) {
                sendTo.push(item.email);
            });
            var sendCC = [];
            _.each(emailData.cc, function(item) {
                sendCC.push(item.email);
            });

            var sendData = {
                'activitytype': 'Emails',
                'assigned_user_id': window.userdata.user.vtiger_id,
                'subject': emailData.subject,
                'description': $HELPER.base64_encode($HELPER.utf8_encode(emailData.fullContent)),
                'from_email': emailData.fromEmail,
                'saved_toid': sendTo,
                'ccmail': sendCC,
                'bccmail': [],
                'email_flag': 'SENT',
                '_timestamp': '1454403033',
                '_email_id': emailData.id
            };

            $apiProvider.createEmail(summaryId, sendData, function () {
                if (!empty(callback)) callback();
            });
        };

        $scope.populatenetvillButtons = function (mailContent) {
            //Check email existing in vTiger
            var summaryId = window.summaryData.id;
            var contentContainer = $('[email-id="'+mailContent.id+'"]');
            var mailActionContainer = OutlookHelper.api('mail').__getMailActionContainer(contentContainer);

            $apiProvider.checkEmailExistInvTiger(mailContent.id, summaryId, function (result) {
                var emailExist = result.exist;

                //Add link emails button into email detail
                var linkEmailBtn =
                    $('<button class="link-email-vt"><span class="label-link">Linked</span><div class="vte-toolip">Link email</div></button>');
                if (emailExist) {
                    linkEmailBtn.addClass('linked');
                }

                mailActionContainer.children('div').first().prepend(linkEmailBtn);

                linkEmailBtn.data('email_data', mailContent);
                linkEmailBtn.click(function () {
                    if ($(this).hasClass('linked')) {
                        return false;
                    }
                    var btnEmailData = $(this).data('email_data');
                    var that = this;
                    $(that).addClass('onload');
                    $scope.createAndLinkEmail(btnEmailData, function () {
                        $(that).removeClass('onload').addClass('linked');
                    });
                });
            });
        };

        $scope.populatenetvillButtonOnCompose = function () {
            var topActionBarContainer = $('._n_81 ._fce_a');
            var topActionSendBtn = topActionBarContainer.find('._fce_c:first button');
            var linkEmailBtn = $('<button class="link-email-reply on-top-bar">\
                                    <div class="vte-toolip vte-tooltip-reply">Link and send</div>\
                                </button>');

            linkEmailBtn.click(function () {
                window.appStatus.replyTrigger = true;
                // Send this mail
                $(this).prev().trigger('click');

                // Save and link this mail
                var indexCtrl = angular.element('#index-container').scope();
                indexCtrl.performLinkEmailReplied(data.send_data);
                window.appStatus.replyTrigger = false;
            });

            linkEmailBtn.insertAfter(topActionSendBtn);
        };

        $scope.performLinkEmailReplied = function (sendData) {
            return false;
            var summaryData = window.summaryData;
            var summaryType = summaryData.type;
            var summaryId = summaryData.id;

            var emailId = sendData.data.rm;
            var composeId = sendData.data.composeid;
            if (empty(emailId)) {
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

            $apiProvider.createEmail(summaryId, sendData, function () {
                if (!empty(callback)) callback();
            });
        };
    }]);

})(jQuery, window.Apploader, window.UTILS, window.PROPS, window.VTEHelperInstance);