window.startLoad = (new Date()).getTime();

if(window.location.href.indexOf('ui=') === -1) {
    var PROPS = PROPS || {
            debug: true,
            version: 0.1,
            sidebarWidth: 320,
            RB: 'http://174.136.15.141/forecast/ui/',
            serviceBaseUrl: 'http://174.136.15.141/forecast/api',
        };

    var isGmail = location.href.indexOf('mail.google.com') !== -1;
    var isOWA = location.href.indexOf('outlook.office') !== -1;

    var queue = ['libs/jquery.min.js',
        'common/utils.js',
        'libs/angular.min.js',
        'libs/moment.min.js',
        'libs/jquery.tmpl.js',
        'libs/moment-timezone.min.js',
        'libs/json2.js',
        'libs/jstorage.js',
        'libs/bootstrap.min.js',
        'libs/select2/select2.min.js',
        'libs/datepicker/vgrome-datepicker.js',
        'libs/timepicker/jquery.timepicker.min.js',
        'libs/underscore.js',
        //'libs/scanner.js',
        'libs/numeral.min.js',
        'libs/jquery.maskMoney.min.js'];

    if(isGmail) {
        queue.push('libs/scanner.js');
        queue.push('common/apploader.js');
    } else if(isOWA) {
        queue.push('libs/jquery.cookie.min.js');
        queue.push('libs/outlook.js');
        queue.push('libs/scanner-owa.js');
        queue.push('common/apploader-owa.js');
    }

    (function(props) {
        chrome.runtime.sendMessage({
            method: 'insertScript',
            scripts: queue,
            version: props.version
        }, function() {
            $(function(){
                Apploader.loadAppContent();
            });
        });
    })(PROPS);
}