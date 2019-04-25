const SemanticChat = require("./semanticchat");

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
class Group extends SemanticChat {

    constructor(options) {
        super(options);
        this.members = options.members;
        this.numberOfMembers = 0;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    saveMember(member) {
        this.members[this.numberOfMembers] = member;
        this.numberOfMembers += 1;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    setMembers(membs) {
        this.members = membs;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getMembers() {
        return this.members;
    }

	/**
	 * This method returns an RDFJSSource of an url
	 * @param {string} url: url of the source
	 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
	 */
    getNumberOfMembers() {
        return this.numberOfMembers;
    }

}

module.exports = Group;
