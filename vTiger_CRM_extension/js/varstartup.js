window.EnLog = false;

(function (utils) {
     // var resourceBase = 'https://localhost/corrensa/public_html/ui/';
    //var resourceBase = 'https://dashboard.vtexperts.com/uic/';
	var resourceBase = 'http://174.136.15.141/forecast/';
	//alert(resourceBase)
     // var Evr = 'dev';
    var Evr = 'prod';
    //var EnLog = ;

    function logMsg(msg) {
        if(window.EnLog) console.log(msg);
    }

    // Does not handle save return value
    function once(func) {
        var ran;
        return function () {
            if (!ran) {
                ran = true;
                func.apply(this, arguments);
                func = null
            }
        }
    }

    // Test for a matching element within an array
    function contains(collection, element) {
        return collection && collection.indexOf(element) !== -1
    }

    function getText(url, callback) {
		//alert(url)
        if(url == '') return false;

        var xhr = new XMLHttpRequest();
        xhr.onload = function good() {
            if (xhr.status === 200) callback(null, xhr.responseText);
            else callback({status: xhr.status, statusText: xhr.statusText})
        };
        xhr.onerror = function bad() {
            callback({status: xhr.status, statusText: xhr.statusText})
        };
        xhr.open('GET', url);
        xhr.send()
    }

    function getTextMulti(urls, callback) {
        if(urls.length == 0) return;

        var index = urls.length;
        var retCount = 0;
        var ret = [];
        var callbackOnce = once(callback);

        function collect(reqIndex) {
            return function collectInner(err, res) {
                if (err) callbackOnce(err);
                else {
                    ret[reqIndex] = res;
                    retCount++
                }
                if (retCount === urls.length) {
                    callbackOnce(null, ret);
                    ret = urls = null; // Big strings, avoid mem leak in closure
                }
            }
        }

        while (index--) getText(urls[index], collect(index))
    }

    function loadScriptFN(scripts, callback) {
		//alert("scripts " + scripts)
        if(scripts.length == 0) return false;

        var scriptBatch = [];
        for (var i in scripts) {
            scriptBatch.push(/*resourceBase + */scripts[i]);
        }

        getTextMulti(scriptBatch, function (err, res) {
            if (!err) {
                var scriptContent = '';
                for (var i in res) {
                    scriptContent += res[i] + "\n";
                }
                if(callback) {
                    callback(scriptContent);
                }
            } else {
                logMsg('failed to load asset from ui server');
            }
        });
    }

    function prepareUrl(list, version) {
        if(utils.isEmpty(list) || utils.isEmpty(list[0])) return false;

        list.forEach(function(item, index) {
            // Loading internal files
            if(item.indexOf('http') === -1) {
                item = resourceBase + item;
            }

            if(!utils.isEmpty(version)) {
                if(item.indexOf('?') !== -1) {
                    item += '&av=' + version;
                } else {
                    item += '?av=' + version;
                }
            }

            list[index] = item;
        });

        return list;
    }

    function addVersion(url, version) {
        if(utils.isEmpty(url)) return false;

        if(!utils.isEmpty(version)) {
            if(url.indexOf('?') !== -1) {
                url += '&av=' + version;
            } else {
                url += '?av=' + version;
            }
        }
        return url;
    }

    // Listens for tabId requests content scripts and sends id of sender back
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        //msg.version = undefined;
        msg.version = msg.version || '';
        msg.nocache = msg.nocache || false;
        msg.scripts = msg.scripts || [];
        msg.url     = msg.url || '';
        msg.urls    = msg.urls || [];
        msg.list    = msg.list || [];
		//alert("msg.method = " + msg.method)
        switch (msg.method) {
            case 'insertScript':
                var scripts = prepareUrl(msg.scripts, msg.version);

                if(Evr === 'dev' || msg.nocache) {
                    logMsg('Load scripts from internet v' + msg.version);
                    logMsg(scripts);

                    loadScriptFN(scripts, function(content) {
                        chrome.tabs.executeScript(sender.tab.id, {code: content});
                        sendResponse({});
                    });
                } else {
                    //Check storage cache
                    var hashName = utils.md5(scripts.join('_'));
                    hashName += '_'+msg.version;

                    utils.memRead(hashName, function(dbRes) {
                        if(!utils.isEmpty(dbRes[hashName])) {
                            logMsg('Load scripts from local v' + msg.version);
                            logMsg(scripts);
                            chrome.tabs.executeScript(sender.tab.id, {code: dbRes[hashName]});
                            sendResponse({});
                        } else {
                            logMsg('Load scripts from internet v' + msg.version);
                            logMsg(scripts);
                            loadScriptFN(scripts, function(content){
                                utils.applyVersion(hashName, content);
                                chrome.tabs.executeScript(sender.tab.id, {code: content});
                                sendResponse({});
                            });
                        }
                    });
                }
                return true;
                break;
            case 'insertCss':
                var scripts = prepareUrl(msg.scripts, msg.version);

                if(Evr === 'dev' || msg.nocache) {
                    logMsg('Load stylesheets from internet v' + msg.version);
                    logMsg(scripts);

                    loadScriptFN(scripts, function(content) {
                        chrome.tabs.insertCSS(sender.tab.id, {code: content});
                        sendResponse({});
                    });
                } else {
                    //Check storage cache
                    var hashName = utils.md5(scripts.join('_'));
                    hashName += '_'+msg.version;

                    utils.memRead(hashName, function(dbRes) {
                        if(!utils.isEmpty(dbRes[hashName])) {
                            logMsg('Load stylesheets from local v'+msg.version);
                            logMsg(scripts);
                            chrome.tabs.insertCSS(sender.tab.id, {code: dbRes[hashName]});
                            sendResponse({});
                        } else {
                            logMsg('Load stylesheets from internet v'+msg.version);
                            logMsg(scripts);
                            loadScriptFN(scripts, function(content){
                                utils.applyVersion(hashName, content);
                                chrome.tabs.insertCSS(sender.tab.id, {code: content});
                                sendResponse({});
                            });
                        }
                    });
                }
                return true;
                break;
            case 'download':
                var url = addVersion(msg.url, msg.version);

                if(Evr === 'dev' || msg.nocache) {
                    logMsg('Download data from internet v'+msg.version);
                    logMsg(url);

                    getText(url, function (err, res) {
                        if (!err) {
                            sendResponse({
                                content: res
                            });
                        } else {
                            logMsg('Download error');
                        }
                    });
                } else {
                    //Check storage cache
                    var hashName = utils.md5(url);
                    hashName += '_'+msg.version;

                    utils.memRead(hashName, function(dbRes){
                        if(dbRes[hashName]) {
                            logMsg('Download data from local v' + msg.version);
                            logMsg(url);
                            sendResponse({content: dbRes[hashName]});
                        } else {
                            logMsg('Download data from internet v' + msg.version);
                            logMsg(url);

                            getText(url, function (err, res) {
                                if (!err) {
                                    sendResponse({content: res});
                                    utils.applyVersion(hashName, res);
                                } else {
                                    logMsg('Download error');
                                }
                            });
                        }
                    });
                }

                return true;
                break;
            case 'downloadMultiple':
                var list = prepareUrl(msg.list, msg.version);

                if(Evr === 'dev' || msg.nocache) {
                    logMsg('Download multiple data from internet v' + msg.version);
                    logMsg(list);

                    getTextMulti(list, function (err, res) {
                        if (!err) {
                            var scriptContent = '';
                            for (var i in res) {
                                scriptContent += res[i] + "\n";
                            }
                            sendResponse({
                                content: scriptContent
                            });
                        } else {
                            logMsg('Download error');
                        }
                    });
                } else {
                    //Check storage cache
                    var hashName = utils.md5(list.join('_'));
                    hashName += '_'+msg.version;

                    utils.memRead(hashName, function(dbRes){
                        if(dbRes[hashName]) {
                            logMsg('Download multiple data from local v' + msg.version);
                            logMsg(list);
                            sendResponse({content: dbRes[hashName]});
                        } else {
                            logMsg('Download multiple data from internet v' + msg.version);
                            logMsg(list);

                            getTextMulti(list, function (err, res) {
                                if (!err) {
                                    var scriptContent = '';
                                    for (var i in res) {
                                        scriptContent += res[i] + "\n";
                                    }
                                    sendResponse({
                                        content: scriptContent
                                    });
                                    utils.applyVersion(hashName, res);
                                } else {
                                    logMsg('Download error');
                                }
                            });
                        }
                    });
                }

                return true;
                break;
            case 'get.resource.current_tab_id':
                if (typeof sender.tab !== 'undefined') {
                    sendResponse({id: sender.tab.id});
                }
                break;
        }
    });
})(UTILS);