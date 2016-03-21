function GmailAdapter() {

    this.gmail = null;

    this.init = function(){
        var that = this;
        this.gmail = new Gmail();

        this.gmail.observe.on('open_email', function(id, url, body, xhr) {
            window.parent.postMessage({
                action: 'fireEvent',
                from: 'out',
                eventType: 'open_email'
            }, '*');
        });

        this.gmail.observe.on("send_message", function(url, body, data, xhr) {
            window.parent.postMessage({
                action: 'fireEvent',
                from: 'out',
                eventType: 'send_message',
                send_data: {
                    'url' : url,
                    'body' : body,
                    'data' : data
                }
            }, '*');
        });

        this.gmail.observe.on("compose", function(compose, type) {
            window.parent.postMessage({
                action: 'fireEvent',
                from: 'out',
                eventType: 'compose_open'
            }, '*');
        });
    };

    this.getGmailId = getGmailId = function(){
        return this.gmail.get.user_email();
    };

    this.actionForEmailOpening = actionForEmailOpening = function(){
        return { mailContent: this.gmail.get.displayed_email_data() }
    };

    this.actionForUpdatenetvillBtn = actionForUpdatenetvillBtn = function(){
        return { mailContent: this.gmail.get.displayed_email_data() }
    };

    this.actionForOpenInbox = actionForOpenInbox = function(){
        return {  }
    };

    this.actionForCheckCurrentPage = actionForCheckCurrentPage = function(){
        return { currentPage: this.gmail.get.current_page() }
    };
}

var gmailAdapterIns = new GmailAdapter();
gmailAdapterIns.init();

//Add a handler to listen when backend call gmail function
window.addEventListener("message", function (sender) {
    if(sender.data.from === 'in') {
        switch (sender.data.action) {
            case 'callFnc':
                var fnName = sender.data.fnName;
                var params = sender.data.fnParams;
                if(params)
                    var result = gmailAdapterIns[fnName](params);
                else
                    var result = gmailAdapterIns[fnName]();
                var data = sender.data;
                data['action'] = 'callFnc_Return';
                data['result'] = result;
                data['from'] = 'out';
                window.parent.postMessage(data, sender.origin);
                break;
        }
    }
}, false);