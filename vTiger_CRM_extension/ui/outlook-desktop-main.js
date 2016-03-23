window.startLoad = (new Date()).getTime();

var PROPS = PROPS || {
        debug: true,
        version: 0.1,
        RB: 'http://174.136.15.141/forecast/ui/',
        serviceBaseUrl: 'http://174.136.15.141/forecast/webservice.php'
    };

var queue = ['libs/jquery.min.js',
    'common/outlook-desktop-utils.js',
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
    'libs/numeral.min.js',
    'libs/jquery.maskMoney.min.js'
];

queue.push('libs/outlook-desktop.js');
queue.push('common/outlook-desktop-apploader.js');

var downloadPack = {
    files: queue,
    version: PROPS.version,
    useCache: true
};

var scriptContent = DownloadResource(JSON.stringify(downloadPack));
eval(scriptContent);
console.log(jQuery.fn.jquery);