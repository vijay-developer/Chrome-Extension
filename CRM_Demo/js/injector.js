window.addEventListener("message", function (sender) {
    switch (sender.data.action) {
        case 'execScript':
            var scriptContents = sender.data.src;

            if(Array.isArray(scriptContents)) {
                scriptContents.forEach(function(item) {
                    eval(item);
                });
                eval(scriptContents);
            } else {
                eval(scriptContents);
            }
            break;
    }
}, false);