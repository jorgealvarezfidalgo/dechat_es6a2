class SemanticChat {

    constructor(options) {

        this.url = options.url;
        this.userWebId = options.userWebId;
        this.interlocutorWebId = options.interlocutorWebId;
        this.chatBaseUrl = options.chatBaseUrl;
        this.messages = [];
        this.numberOfMessages = 0;
		this.interlocutorName = options.interlocutorName;
		this.photo = options.photo;
		this.lastHr = options.lastHr;

    }

    getUrl() {
        return this.url;
    }

    getInterlocutorWebId() {
        return this.interlocutorWebId;
    }

    loadMessage(message) {
        this.messages[this.numberOfMessages] = message;
        this.numberOfMessages += 1;
    }


    getMessages() {
        return this.messages;
    }

    getNumberOfMsgs() {
        return this.numberOfMessages;
    }

    getLastMessage() {
        if (this.numberOfMessages > 0) {
            return this.messages[this.numberOfMessages - 1];
        } else {
            return {
                messagetext: null
            };
        }
    }

    getHourOfMessage(msg) {
        if (this.numberOfMessages > 0) {
            return this.messages[msg].time.substring(11, 16).replace("\-", "\:");
        } else {
            return null;
        }
    }


}

module.exports = SemanticChat;
