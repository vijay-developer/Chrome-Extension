(function(utils, props, $, scanner){
    window.firstTimeLoadSite = true;

    function getMainContainer() {
        return $('[role="main"]');
    }

    function getAvailableWidthForMailView() {
        var status = $('#netvill_ext').hasClass('off') ? 'off' : 'on';
        var fullWidth = $(window).width();

        var size = fullWidth;

        if(status == 'on') size -= props.sidebarWidth;
        else size -= 40;

        return size;
    }

    function AppLoader() {
        this.switchSidebarState = switchSidebarState = function(state) {
            utils.log('switch to ' + state);
            var domState = $('#netvill_ext').hasClass('off') ? 'off' : 'on';

            var switchTo = state;

            if(switchTo == 'off') {
                $('#netvill_ext').addClass('off');
                $('.tab-content').hide();
                $('.header-bar span').hide();

                getMainContainer().width(getAvailableWidthForMailView());
                //utils._getToolbar().width(getAvailableWidthForMailView() - 10);
                //utils._getToolbar2().width(getAvailableWidthForMailView() - 10);
                $('.btn-collapse-app').attr('title', 'Open netvill');
                $('.btn-collapse-app').attr('data-original-title', 'Open netvill');
            } else {
                $('.tab-content').show();
                $('.header-bar span').show();
                $('#netvill_ext').removeClass('off');
                //var mailListWrapperWidth = utils._getMailListWrapper().width();

                getMainContainer().width(getAvailableWidthForMailView());
                //utils._getToolbar().width(getAvailableWidthForMailView() - 10);
                //utils._getToolbar2().width(getAvailableWidthForMailView() - 10);
                $('.btn-collapse-app').attr('title', 'Hide netvill');
                $('.btn-collapse-app').attr('data-original-title', 'Hide netvill');
            }

            $.jStorage.set('vte_sidebar_state', switchTo);
            //utils._getMailListView().width(getAvailableWidthForMailView());
            //utils._getMailListWrapper().width(getAvailableWidthForMailView());
        };

        this.bootIntonetvill = bootIntonetvill = function() {
            utils.log('Apploader:boot:start');
            var bootElement = document.getElementById('netvill_ext');

            angular.element(bootElement).ready(function () {
                angular.bootstrap(bootElement, ['netvill']);
            });

            utils.log('Apploader:boot:done');
        };

        this.updateContainerSize = updateContainerSize = function() {
            if(getMainContainer()) {
                setTimeout(function() {
                    $('#netvill_ext').height(getMainContainer().height());
                    $('.tab-content').height(getMainContainer().height() - 47);
                    $('#netvill_ext .app-menu').height(getMainContainer().height());
                    $('#netvill_ext .app-body').height(getMainContainer().height());
                    $('#app-dialog-container').height($('.app-body').height());
                }, 500);
            } else {
                setTimeout(function() {
                    updateContainerSize();
                }, 100);
            }
        };

        this.initialDialogAndBaseData = function() {
            window.AppDialog = {
                show: function(title, msg) {
                    if (title) {
                        $('.app-dialog-header .title-text').text(title);
                    }

                    if (msg) {
                        $('.app-dialog-body .message-text').html(msg);
                    }

                    $('#app-dialog-container').fadeIn('fast');
                }
            };

            window.summaryData = false;
            window.appStatus = {
                selectedEmail: false,
                isDevMode: false,
                replyTrigger: false,
            };

            window.appProps = props;

            /* APP DIALOG */
            $('body').on('click', '#app-dialog-container', function(e) {
                var target = e.target;
                var that = this;

                if($(target).attr('id') == 'app-dialog-container') {
                    $(that).fadeOut('fast');
                }
            });

            $('body').on('click', '.ok-btn', function(){
                $('#app-dialog-container').fadeOut('fast');
            });
        };

        this.loadAppContent = loadAppContent = function() {

            this.initialDialogAndBaseData();

            function doLoad() {
                utils.log('Apploader:loadApp');
                window.netvill = angular.module('netvill', []);
                // Enable scp when bootstrap mannualy
                window.netvill.config(function($sceProvider) {
                    $sceProvider.enabled(false);
                });

                utils.insertScript([
                    'app/models/util_service.js',
                    'app/models/api_provider.js',
                    'app/controllers/entity.js',
                    'app/controllers/inventory.js',
                    'app/controllers/base-index.js',
                    'app/controllers/index-owa.js',
                    'app/controllers/account.js',
                    'app/controllers/calendar.js',
                    'app/controllers/config.js',
                    'app/controllers/person.js',
                    'app/controllers/potential.js',
                    'app/controllers/quote.js',
                    'app/controllers/invoice.js',
                    'app/controllers/search.js',
                    'app/controllers/summary.js',
                    'app/controllers/ticket.js',
                    'app/controllers/popup-detail.js'
                ], function(res){
                    // Load index template/controller
                    utils.downloadTemplate('app/views/index.html', function(appHtml) {
                        var baseHtml = '<div id="netvill_ext" class="netvill-enable">'+appHtml+'</div>';

                        // Insert netvill into gmail
                        $(baseHtml).insertAfter(getMainContainer());

                        // Calculate time load
                        var currentTime = (new Date()).getTime();
                        var totalTimeLoad = currentTime - window.startLoad;
                        utils.log("Resource loaded in " + totalTimeLoad + "ms");

                        // Start render angular for app
                        bootIntonetvill();

                        var storageState = $.jStorage.get('vte_sidebar_state');
                        if(storageState == null) storageState = 'on';
                        switchSidebarState(storageState);

                        // Wait until index scope loaded then start scanner
                        //var listenForIndexContainer = setInterval(function() {
                        //    if($('#index-container').length > 0) {
                        //        // Init scanner
                        //        scanner.load();
                        //        clearInterval(listenForIndexContainer);
                        //    }
                        //}, 300);
                    });
                });

                var cssQueue = ['libs/org/css/ui-vendor.css',
                    'libs/netvill-vertial-tab.css',
                    'libs/select2/select2.css',
                    'libs/datepicker/netvill-datepicker.css',
                    'libs/timepicker/jquery.timepicker.css',
                    'libs/font-awesome/css/font-awesome-netvill.css',
                    'libs/metro-checkboxradio.css',
                    'css/global-outlook.css'];

                utils.insertCss(cssQueue);

                $('body').tooltip({ selector: '.tooltip-tab' });
                $(window).resize(function () {
                    setTimeout(function () {
                        var storageState = $.jStorage.get('vte_sidebar_state');
                        if(storageState == null) storageState = 'on';
                        switchSidebarState(storageState);
                    });
                });
                utils.log('Apploader:loadDone');
            }


            //Wait for all gmail's views loaded then boot into netvill
            //var waitingForGmail = setInterval(function() {
            //    if($('#loading:hidden').length > 0) {
                    doLoad();
            //        clearInterval(waitingForGmail);
            //    }
            //
            //    utils.log('Still waiting for outlook loading');
            //    utils.log(document.getElementById('loadingLogo'));
            //}, 500);

            setInterval(function() {
                updateContainerSize();
            }, 1000);
        };
    }

    window.Apploader = new AppLoader();

})(UTILS, PROPS, jQuery, window.Scanner);