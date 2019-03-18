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

    // if move base url is a string create function that returns this string
    // else a function so we leave it
    if (typeof this.chatBaseUrl === 'string') {
      const t = this.chatBaseUrl;

      this.chatBaseUrl = function() {
        return t;
      }
    }

    // set the default uniqid function to the function of the package 'uniqid'
    if (!options.uniqid) {
      this.uniqid = require('uniqid');
    } else {
      this.uniqid = options.uniqid;
    }

  }

  /**
   * This method must return a representation of the chat at its initial stage.
   * @returns {string}: Representation of the chat
   */
  getMinimumInfo() {
    this.minimumInfo = `<${this.url}>`;
    return this.minimumInfo;

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
