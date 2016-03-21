$.extend({
    tmpl : function(tmpl, vals, htmlDecode) {
        var rgxp, repr;

        // default to doing no harm
        tmpl = tmpl   || '';
        vals = vals || {};
        htmlDecode = htmlDecode || false;

        // regular expression for matching our placeholders; e.g., #{my-cLaSs_name77}
        rgxp = /#\{([^{}]*)}/g;

        // function to making replacements
        repr = function (str, match) {
            return typeof vals[match] === 'string' || typeof vals[match] === 'number'
                ? vals[match] : vals[match] === null ? '' : str;
        };

        var result = tmpl.replace(rgxp, repr);

        if(htmlDecode) {
            result = $.htmlDecode(result);
        }

        return result;
    },
    htmlDecode: function(s){
        return $('<div>').html(s).text();
    }
});