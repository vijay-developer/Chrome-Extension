window.startLoad = (new Date()).getTime();

if(window.location.href.indexOf('ui=') === -1) {
    var PROPS = PROPS || {
            debug: true,
            version: 2.8,
            sidebarWidth: 320,
            RB: 'http://174.136.15.141/forecast/ui/',
            serviceBaseUrl: 'https://dashboard.vtexperts.com/api',
            //RB: 'https://dashboard.vtexperts.com/ui/',
            //serviceBaseUrl: 'https://dashboard.vtexperts.com/api'
        };

    var isGmail = location.href.indexOf('mail.google.com') !== -1;
    var isOWA = location.href.indexOf('outlook.office') !== -1;

    var queue = ['ext_js/jquery.min.js',
        'ext_js/utils.js',
        'ext_js/angular.min.js',
        'ext_js/moment.min.js',
        'ext_js/jquery.tmpl.js',
        'ext_js/moment-timezone.min.js',
        'ext_js/json2.js',
        'ext_js/jstorage.js',
        'ext_js/bootstrap.min.js',
        'ext_js/select2.min.js',
        'ext_js/vgrome-datepicker.js',
        'ext_js/jquery.timepicker.min.js',
        'ext_js/underscore.js',
        //'ext_js/scanner.js',
        'ext_js/numeral.min.js',
        'ext_js/jquery.maskMoney.min.js'];

    if(isGmail) {
        queue.push('ext_js/scanner.js');
        queue.push('ext_js/apploader.js');
    } else if(isOWA) {
        queue.push('ext_js/jquery.cookie.min.js');
        queue.push('ext_js/outlook.js');
        queue.push('ext_js/scanner-owa.js');
        queue.push('ext_js/apploader-owa.js');
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