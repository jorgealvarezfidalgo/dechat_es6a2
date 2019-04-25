const SemanticChat = require("./semanticchat");

/**
 * Logic representation of a Group Chat
 */
class Group extends SemanticChat {

    constructor(options) {
        super(options);
        this.members = options.members;
        this.numberOfMembers = 0;
    }

	/**
	 * Adds a member to the Group
	 * @param {string} member: WebId of the new member.
	 */
    saveMember(member) {
        this.members[this.numberOfMembers] = member;
        this.numberOfMembers += 1;
    }

	/**
	 * Sets members of the Group
	 * @param {string[]} member: WebIds of the members.
	 */
    setMembers(membs) {
        this.members = membs;
    }

	/**
	 * This method returns a list of members.
	 * @returns {string[]}: a list of the members of the Group.
	 */
    getMembers() {
        return this.members;
    }

	/**
	 * This method returns a number of members.
	 * @returns {int}: number of the members of the Group.
	 */
    getNumberOfMembers() {
        return this.numberOfMembers;
    }

}

module.exports = Group;
