	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
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

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getUrl() {
        return this.url;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getInterlocutorWebId() {
        return this.interlocutorWebId;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    loadMessage(message) {
        this.messages[this.numberOfMessages] = message;
        this.numberOfMessages += 1;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getMessages() {
        return this.messages;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getNumberOfMsgs() {
        return this.numberOfMessages;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getLastMessage() {
        if (this.numberOfMessages > 0) {
            return this.messages[this.numberOfMessages - 1];
        } else {
            return {
                messagetext: null
            };
        }
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getHourOfMessage(msg) {
        if (this.numberOfMessages > 0) {
            return this.messages[msg].time.substring(11, 16).replace("\-", "\:");
        } else {
            return null;
        }
    }


}

module.exports = SemanticChat;
