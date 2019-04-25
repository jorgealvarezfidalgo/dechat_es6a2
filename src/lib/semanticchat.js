/**
 * Logic representation of a Individual Chat
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
	 * This method returns its URL.
	 * @returns {string}: chat URL.
	 */
    getUrl() {
        return this.url;
    }

	/**
	 * This method returns the interlocutor ID.
	 * @returns {string}: WebId of the interlocutor.
	 */
    getInterlocutorWebId() {
        return this.interlocutorWebId;
    }

	/**
	 * Loads messages to the chat.
	 * @param {Object} message: message to load.
	 */
    loadMessage(message) {
        this.messages[this.numberOfMessages] = message;
        this.numberOfMessages += 1;
    }

	/**
	 * This method returns a list of messages.
	 * @returns {string[]}: a list of the messages of the Chat.
	 */
    getMessages() {
        return this.messages;
    }

	/**
	 * This method returns a number of messages.
	 * @returns {int}: number of messages of the Chat.
	 */
    getNumberOfMsgs() {
        return this.numberOfMessages;
    }

	/**
	 * This method returns the last message.
	 * @returns {string[]}: a list of the members of the Group.
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
	 * This method returns the hour of a certain message
	 * @returns {string}: hour of the message.
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
