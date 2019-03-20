const SemanticChat = require('./semanticchat');

class Group extends SemanticChat {

    constructor(options) {
		super(options);
        this.members = options.members;
		this.numberOfMembers = 0;

    }

    saveMember(member) {
        this.members[this.numberOfMembers] = member;
        this.numberOfMembers += 1;
    }


    getMessages() {
        return this.members;
    }

    getNumberOfMembers() {
        return this.numberOfMessages;
    }

}

module.exports = SemanticChat;