const Service = require("./Service");
const BaseService = require("./BaseService");

/**
 * Encapsulates all functionality related with creating a chat.
 */
class CreateService extends Service {

    constructor(fetch) {
        super(fetch);
        this.baseService = new BaseService(this.auth.fetch);
    }

    /**
     * This method creates a Semantic Chat (1 to 1)
     * @param {string} userDataUrl: base URL for the chat.
     * @param {string} userWebId: chat creator WebId.
     * @param {string} interlocutorWebId: chat interlocutor WebId.
     * @returns {SemanticChat}: an instance of SemanticChat
     */
    async setUpNewChat(userDataUrl, userWebId, interlocutorWebId) {
        const chatUrl = await this.baseService.generateUniqueUrlForResource(userDataUrl);
        const semanticChat = new this.SemanticChat({
            url: chatUrl,
            messageBaseUrl: userDataUrl,
            userWebId,
            interlocutorWebId
        });

        var ids = [];
        ids.push(interlocutorWebId);

        await this.setUpNew(chatUrl, userDataUrl, userWebId, ids, semanticChat, ids[0]);

        return semanticChat;
    }

    /**
     * This method creates a Group.
     * @param {string} userDataUrl: base URL for the group.
     * @param {string} userWebId: group creator WebId.
     * @param {string[]} interlocutorWebIds: all interlocutors WebId.
     * @param {string} friendName: group name.
     * @returns {Group}: an instance of Group.
     */
    async setUpNewGroup(userDataUrl, userWebId, interlocutorWebIds, friendName) {

        const chatUrl = await this.baseService.generateUniqueUrlForResource(userDataUrl);
        const group = new this.Group({
            url: chatUrl,
            chatBaseUrl: userDataUrl,
            userWebId,
            members: interlocutorWebIds,
            interlocutorName: friendName,
            interlocutorWebId: "Group/" + friendName,
            photo: "main/resources/static/img/group.jpg"
        });

        await this.setUpNew(chatUrl, userDataUrl, userWebId, interlocutorWebIds, group, userWebId.split("card")[0] + "Group/" + friendName);

        return group;
    }

    /**
     * Base creation method. Adds new chat to storage and encrypts its data.
     * @param {string} chatDataUrl: chat URL.
     * @param {string} userDataUrl: chat storage URL.
     * @param {string} userWebId: chat creator WebId.
     * @param {string[]} interlocutorWebIds: all interlocutors WebId.
     * @param {SemanticChat} semanticChat: SemanticChat/Group instance.
     * @param {string} firstId: chat creator or group name.
     */
    async setUpNew(chatUrl, userDataUrl, userWebId, interlocutorWebIds, semanticChat, firstId) {

        var encuser = this.encrypter.encrypt(userWebId, false);
        var encfirst = this.encrypter.encrypt(firstId, false);
        var encdata = this.encrypter.encrypt(userDataUrl, false);

        try {
            await this.uploader.executeSPARQLUpdateForUser(userWebId.replace("profile/card#me", "private/chatsStorage.ttl"), `INSERT DATA { <${chatUrl}> <${this.namespaces.schema}contributor> <${encuser}>;
			<${this.namespaces.schema}recipient> <${encfirst}>;
			<${this.namespaces.storage}storeIn> <${encdata}>.}`);
        } catch (e) {
            this.logger.error("Could not add chat to WebId.");
            this.logger.error(e);
        }
        await this.storeAndSendInvitations(userDataUrl, userWebId, interlocutorWebIds, semanticChat);
    }

    /**
     * Creates invitations, sends them to interlocutors and stores them for future introspection.
     * @param {string} userDataUrl: chat storage URL.
     * @param {string} userWebId: chat creator WebId.
     * @param {string[]} interlocutorWebIds: all interlocutors WebIds.
     * @param {SemanticChat} semanticChat: SemanticChat/Group instance.
     */
    async storeAndSendInvitations(userDataUrl, userWebId, interlocutorWebIds, semanticChat) {
        var id = userWebId;
        interlocutorWebIds.forEach(async (interlocutorWebId) => {

            if (interlocutorWebIds.length > 1) {
                id = "Group/" + semanticChat.interlocutorName + "----" + userWebId;
                interlocutorWebIds.forEach(async interlocWebId => {
                    if (interlocWebId !== interlocutorWebId) {
                        id += "----" + (interlocWebId.id ? interlocWebId.id : interlocWebId);
                    }
                });

            }
            var invitation = await this.generateInvitation(userDataUrl, semanticChat.getUrl(), id, (interlocutorWebId.id ? interlocutorWebId.id : interlocutorWebId));
            try {
                await this.uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA{${invitation.forprivate}}`);
            } catch (e) {
                logger.error("Could not add chat to WebId.");
                logger.error(e);
            }
            try {
                await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(interlocutorWebId.id ? interlocutorWebId.id : interlocutorWebId), invitation.forinbox);
            } catch (e) {
                this.logger.error("Could not send invitation to interlocutor.");
                this.logger.error(e);
            }
        });
    }

    /**
     * Creates an object which represents an encrypted invitation.
     * @param {string} baseUrl: base URL to generate invitation URL.
     * @param {string} chatUrl: chat storage URL.
     * @param {string} userWebId: chat creator WebId.
     * @param {string} interlocutorWebId: target WebId.
     * @returns {Object}: Private and Inbox invitations (different encryption).
     */
    async generateInvitation(baseUrl, chatUrl, userWebId, interlocutorWebId) {
        const invitationUrl = await this.baseService.generateUniqueUrlForResource(baseUrl);

        var encurl = this.encrypter.encrypt(chatUrl, false);
        var encuser = this.encrypter.encrypt(userWebId, false);
        var encint = this.encrypter.encrypt(interlocutorWebId, false);

        const i1 = `
    <${invitationUrl}> a <${this.namespaces.schema}InviteAction>;
      <${this.namespaces.schema}event> <${encurl}>;
      <${this.namespaces.schema}agent> <${encuser}>;
      <${this.namespaces.schema}recipient> <${encint}>.
  `;

        encurl = this.encrypter.encrypt(chatUrl, true);
        encuser = this.encrypter.encrypt(userWebId, true);
        encint = this.encrypter.encrypt(interlocutorWebId, true);

        const i2 = `
    <${invitationUrl}> a <${this.namespaces.schema}InviteAction>;
      <${this.namespaces.schema}event> <${encurl}>;
      <${this.namespaces.schema}agent> <${encuser}>;
      <${this.namespaces.schema}recipient> <${encint}>.
  `;

        return {
            "forprivate": i1,
            "forinbox": i2
        };
    }


}

module.exports = CreateService;