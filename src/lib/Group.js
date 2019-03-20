const SemanticChat = require('./semanticchat');

class Group extends SemanticChat {

    constructor(options) {
		super(options);
		console.log(options);
        this.members = options.members;
		this.numberOfMembers = 0;

    }

    saveMember(member) {
        this.members[this.numberOfMembers] = member;
        this.numberOfMembers += 1;
    }
	
	setMembers(membs) {
		this.members = membs;
	}

    getMembers() {
        return this.members;
    }

    getNumberOfMembers() {
        return this.numberOfMessages;
    }

}

module.exports = Group;