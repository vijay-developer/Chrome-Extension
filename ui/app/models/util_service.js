(function(utils, props, $){
    function VTEHelper() {
        var root = this;

        this.nl2br = function(str, is_xhtml){
            var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>';

            return (str + '')
                .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
        };

        this.formatTime = function(timeStr){
            if(timeStr) {
                var times = timeStr.split(':');
                var sign = times[0] >= 12 ? 'PM' : 'AM';
                times[0] = times[0] > 12 ? times[0] - 12 : times[0];
                return times[0] + ':' + times[1] + ' ' + sign;
            } else {
                return "";
            }
        };

        this.getCurrentEmailDetail = function() {
            var gmail = new Gmail();
            var emailData = gmail.get.displayed_email_data();
            var firstThreadId = emailData.first_email;
            var firstThead = emailData.threads[firstThreadId];

            return {
                'subject': emailData.subject,
                'content_html': firstThead.content_html,
                'timestamp': firstThead.timestamp,
                'from_name': firstThead.from,
                'from_email': firstThead.from_email,
                'to': firstThead.to,
                'cc': firstThead.cc,
                'bcc': firstThead.bcc
            }
        };

        this.convertDate = function(fromFormat, toFormat, dateStr){
            fromFormat = fromFormat.split('-');
            dateStr = dateStr.split('-');
            var y, m, d = null;
            for(var i in fromFormat) {
                if (fromFormat[i] == 'yyyy')
                    y = dateStr[i];
                else if (fromFormat[i] == 'mm')
                    m = dateStr[i];
                else if (fromFormat[i] == 'dd')
                    d = dateStr[i];
            }
            toFormat = toFormat.replace('mm', m);
            toFormat = toFormat.replace('dd', d);
            toFormat = toFormat.replace('yyyy', y);
            return toFormat;
        };

        this.parseDate = function(sourceFormat, date){
            sourceFormat = sourceFormat.split('-');
            date = date.split('-');

            var result = {};
            result[sourceFormat[0]] = date[0];
            result[sourceFormat[1]] = date[1];
            result[sourceFormat[2]] = date[2];

            return result;
        };

        this.convertDatetimeTovTigerTZ = function(datetimeStr){
            datetimeStr = datetimeStr.replace(' AM', ':00');
            datetimeStr = datetimeStr.replace(' PM', ':00');

            // Todo need to query base timezone in customer vTiger
            var dataTimezone = 'UTC';
            var userTimeZone = userdata.user.timezone;
            var dataDateFormat = 'yyyy-mm-dd';
            var userDateFormat = userdata.user.date_format;

            var dateStr = datetimeStr.split(' ')[0];
            var timeStr = datetimeStr.split(' ')[1];
            var dateStrComs = this.parseDate(userDateFormat, dateStr);

            var dateTimeStr = dateStrComs['yyyy'] + '-' + dateStrComs['mm'] + '-' + dateStrComs['dd'] + ' ' + timeStr;

            var dateTime = moment.tz(dateTimeStr, userTimeZone);
            dateTime.tz(dataTimezone);

            dataDateFormat = dataDateFormat.toUpperCase();

            return dateTime.format(dataDateFormat + ' ' + 'HH:mm:ss');
        };

        this.convertDatetimeToDisplay = function(datetimeStr){
            datetimeStr = datetimeStr.replace(' AM', ':00');
            datetimeStr = datetimeStr.replace(' PM', ':00');

            // Todo need to query base timezone in customer vTiger
            var dataTimezone = 'UTC';
            var userTimeZone = userdata.user.timezone;
            var dataDateFormat = 'yyyy-mm-dd';
            var userHourFormat = userdata.user.hour_format;
            var userDateFormat = userdata.user.date_format;

            var dateStr = datetimeStr.split(' ')[0];
            var timeStr = datetimeStr.split(' ')[1];
            var dateStrComs = this.parseDate(dataDateFormat, dateStr);

            var dateTimeStr = dateStrComs['yyyy'] + '-' + dateStrComs['mm'] + '-' + dateStrComs['dd'] + ' ' + timeStr;

            var dateTime = moment.tz(dateTimeStr, dataTimezone);
            dateTime.tz(userTimeZone);

            userDateFormat = userDateFormat.toUpperCase();

            if(userHourFormat == 12) {
                return dateTime.format(userDateFormat + ' ' + 'hh:mm A');
            } else {
                return dateTime.format(userDateFormat + ' ' + 'HH:mm');
            }
        };

        this.convertDateToDisplay = function(dateStr) {
            var now = moment();

            // Todo need to query base timezone in customer vTiger
            var dataTimezone = 'UTC';
            var userTimeZone = userdata.user.timezone;
            var dataDateFormat = 'yyyy-mm-dd';
            var userHourFormat = userdata.user.hour_format;
            var userDateFormat = userdata.user.date_format;

            var timeStr = now.format('HH:mm');
            var dateStrComs = this.parseDate(dataDateFormat, dateStr);

            var dateTimeStr = dateStrComs['yyyy'] + '-' + dateStrComs['mm'] + '-' + dateStrComs['dd'] + ' ' + timeStr;

            var dateTime = moment.tz(dateTimeStr, dataTimezone);
            dateTime.tz(userTimeZone);

            userDateFormat = userDateFormat.toUpperCase();

            return dateTime.format(userDateFormat);
        };

        this.formatToVTFormat = function(field, value, subData) {
            if(field.uitype.name == 'datetime') {
                if(!empty(subData)) {
                    value += ' ' + subData['time']
                } else {
                    value += ' 00:00:00';
                }

                var dateTimeValue = this.convertDatetimeTovTigerTZ(value);
                return dateTimeValue.split(' ');
            } else if (field.uitype.name == 'date') {
                var dateStr = this.parseDate(userdata.user.date_format, value);
                var vtFormat = dateStr['yyyy'] + '-' + dateStr['mm'] + '-' + dateStr['dd'];
                return vtFormat;
            } else if (field.uitype.name == 'currency') {
                var decimalChar = userdata.user.currency_decimal_separator;

                value = value.replace('$', '');

                if(decimalChar == ',') {
                    var coms = value.split(',');
                    value = coms[0].split('.').join('') + '.' + coms[1];
                } else {
                    var coms = value.split('.');
                    value = coms[0].split(',').join('') + '.' + coms[1];
                }

                return value;
            } else if(field.uitype.name == 'time'){
                if(value != '') {
                    var sign = value.split(' ')[1];
                    var times = value.split(' ')[0].split(':');
                    if(sign == 'PM') {
                        times[0] = times[0] < 12 ? parseInt(times[0]) + 12 : times[0];
                    }
                    value = times[0] + ':' + times[1];
                }

                return value;
            } else {
                return value;
            }
        };

        this.formatValueByFieldForEditing = function(field, value, record){
            var that = this;
            var uitype = field.uitype != undefined ? field.uitype.name : field.type.name;

            if(uitype == 'datetime') {
                if(field.name == 'date_start') {
                    value += ' ' + record['time_start'];
                } else if(field.name == 'due_date') {
                    value += ' ' + record['time_end'];
                }
                var converted = root.convertDatetimeToDisplay(value);
                return converted.split(' ');
            } else if(uitype == 'date') {
                return that.convertDateToDisplay(value);
            } else if(uitype == 'currency') {
                var zeroStr = "";
                for(var i in userdata.currency.no_of_decimals) {zeroStr += '0'}

                value = userdata.currency.symbol +
                    numeral(value).format('0,0.'+zeroStr);

                if(userdata.currency.decimal_separator == ',' && userdata.currency.grouping_separator == '.') {
                    value = root.replaceAll('.', '#', value);
                    value = root.replaceAll(',', '.', value);
                    value = root.replaceAll('#', ',', value);
                }
                return value;
            } else {
                return value;
            }
        };

        this.formatValueByField = function(field, value) {
            var that = this;
            var uitype = field.uitype != undefined ? field.uitype.name : field.type.name;

            if(uitype == 'currency') {
                var zeroStr = "";
                for(var i in userdata.currency.no_of_decimals) {zeroStr += '0'}

                value = userdata.currency.symbol +
                    numeral(value).format('0,0.'+zeroStr);

                if(userdata.currency.decimal_separator == ',' && userdata.currency.grouping_separator == '.') {
                    value = root.replaceAll('.', '#', value);
                    value = root.replaceAll(',', '.', value);
                    value = root.replaceAll('#', ',', value);
                }
                return value;
            } else if(uitype == 'datetime') {
                return root.convertDatetimeToDisplay(value);
            } else if(uitype == 'date') {
                return that.convertDateToDisplay(value);
            } else {
                return value;
            }
        };

        this.inArray = function(focus, elements){
            var has = false;
            _.each(elements, function(element){
                if(focus == element) {
                    has = true;
                    return;
                }
            });

            return has;
        };

        this.base64_encode = function(data) {
            var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
                ac = 0,
                enc = '',
                tmp_arr = [];

            if (!data) {
                return data;
            }

            do { 
                o1 = data.charCodeAt(i++);
                o2 = data.charCodeAt(i++);
                o3 = data.charCodeAt(i++);

                bits = o1 << 16 | o2 << 8 | o3;

                h1 = bits >> 18 & 0x3f;
                h2 = bits >> 12 & 0x3f;
                h3 = bits >> 6 & 0x3f;
                h4 = bits & 0x3f;

                tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
            } while (i < data.length);

            enc = tmp_arr.join('');

            var r = data.length % 3;

            return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
        };

        this.utf8_encode = function(argString) {
            if (argString === null || typeof argString === 'undefined') {
                return '';
            }

            var string = (argString + '');
            var utftext = '',
                start, end, stringl = 0;

            start = end = 0;
            stringl = string.length;
            for (var n = 0; n < stringl; n++) {
                var c1 = string.charCodeAt(n);
                var enc = null;

                if (c1 < 128) {
                    end++;
                } else if (c1 > 127 && c1 < 2048) {
                    enc = String.fromCharCode(
                        (c1 >> 6) | 192, (c1 & 63) | 128
                    );
                } else if ((c1 & 0xF800) != 0xD800) {
                    enc = String.fromCharCode(
                        (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
                    );
                } else {
                    if ((c1 & 0xFC00) != 0xD800) {
                        throw new RangeError('Unmatched trail surrogate at ' + n);
                    }
                    var c2 = string.charCodeAt(++n);
                    if ((c2 & 0xFC00) != 0xDC00) {
                        throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
                    }
                    c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
                    enc = String.fromCharCode(
                        (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
                    );
                }
                if (enc !== null) {
                    if (end > start) {
                        utftext += string.slice(start, end);
                    }
                    utftext += enc;
                    start = end = n + 1;
                }
            }

            if (end > start) {
                utftext += string.slice(start, stringl);
            }

            return utftext;
        };

        this.replaceAll = function(search, replace, subject, count){
                var i = 0,
                    j = 0,
                    temp = '',
                    repl = '',
                    sl = 0,
                    fl = 0,
                    f = [].concat(search),
                    r = [].concat(replace),
                    s = subject,
                    ra = Object.prototype.toString.call(r) === '[object Array]',
                    sa = Object.prototype.toString.call(s) === '[object Array]';
                s = [].concat(s);
                if (count) {
                    this.window[count] = 0;
                }

                for (i = 0, sl = s.length; i < sl; i++) {
                    if (s[i] === '') {
                        continue;
                    }
                    for (j = 0, fl = f.length; j < fl; j++) {
                        temp = s[i] + '';
                        repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
                        s[i] = (temp)
                            .split(f[j])
                            .join(repl);
                        if (count && s[i] !== temp) {
                            this.window[count] += (temp.length - s[i].length) / f[j].length;
                        }
                    }
                }
                return sa ? s : s[0];
            };
    }

    window.VTEHelperInstance = new VTEHelper();

})(UTILS, PROPS, jQuery);