const Service = require("./Service");
const BaseService = require("./BaseService");
const CreateService = require("./CreateService");

/**
 * Encapsulates all functionality related with joining a chat.
 */
class JoinChatService extends Service {
    constructor(fetch) {
        super(fetch);
        this.baseService = new BaseService(this.auth.fetch);
        this.createService = new CreateService(this.auth.fetch);
    }

    /**
     * Joins a chat by storing all info recovered from the invitation in current user's POD.
     * @param {string} userDataUrl: storage URL.
     * @param {string} interlocutorWebId: WebId of the interlocutor.
     * @param {string} userWebId: WebId of current user.
     * @param {string} urlChat: chat URL
     * @param {string} name: Group name, if Group.
     * @param {string[]} members: Group members, if group.
     */
    async joinExistingChat(userDataUrl, interlocutorWebId, userWebId, urlChat, name, members) {
        this.createService.setEncrypter(this.encrypter);
        var recipient = interlocutorWebId;
        var participants = [];
        if (interlocutorWebId.includes("Group")) {
            recipient = userWebId.split("card")[0] + "Group/" + name;
            participants = members;
        } else {
            participants.push(recipient);
        }
        participants.forEach(async (mem) => {
            var invitation = await this.createService.generateInvitation(userDataUrl, urlChat, userWebId, mem);
            try {
                await this.uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA{${invitation.forprivate}}`);
            } catch (e) {
                logger.error("Could not add chat to WebId.");
            }
        });

        var encuser = this.encrypter.encrypt(userWebId, false);
        var encrec = this.encrypter.encrypt(recipient, false);
        var encdata = this.encrypter.encrypt(userDataUrl, false);

        try {
            await this.uploader.executeSPARQLUpdateForUser(userWebId.replace("profile/card#me", "private/chatsStorage.ttl"), `INSERT DATA { <${urlChat}> <${this.namespaces.schema}contributor> <${encuser}>;
    			<${this.namespaces.schema}recipient> <${encrec}>;
    			<${this.namespaces.storage}storeIn> <${encdata}>.}`);
        } catch (e) {
            logger.error("Could not add chat to WebId.");
        }
    }

    /**
     * Processes data loaded from invitation.
     * @param {Object} chat: recovered data.
     * @param {string} fileurl: URL of file which contained the data.
     * @param {string} userWebId: WebId of current user.
     * @param {string} userDataUrl: URL of storage.
     * @return {SemanticChat}: Processed data into a SemanticChat instance.
     */
    async processChatToJoin(chat, fileurl, userWebId, userDataUrl) {
        var chatJoined = null;
        if (chat.friendIds[0].includes("Group")) {
            var name = chat.friendIds[0].split("/").pop();
            chat.friendIds.splice(0, 1);
            chatJoined = new this.Group({
                url: fileurl,
                chatBaseUrl: userDataUrl,
                userWebId,
                members: chat.friendIds,
                interlocutorName: name.replace(/U\+0020/g, " "),
                interlocutorWebId: "Group/" + name.replace(/U\+0020/g, " "),
                photo: "main/resources/static/img/group.jpg"
            });
        } else {
            chatJoined = new this.SemanticChat({
                url: fileurl,
                messageBaseUrl: userDataUrl,
                userWebId,
                interlocutorWebId: chat.friendIds[0],
                interlocutorName: await this.baseService.getFormattedName(chat.friendIds[0])
            });
        }
        return chatJoined;
    }

    /**
     * Loads invitation data.
     * @param {string} fileurl: URL of file which contains the data.
     * @param {string} userWebId: WebId of current user.
     * @return {Object}: Loaded data.
     */
    async getJoinRequest(fileurl, userWebId) {
        this.baseService.setEncrypter(this.encrypter);
        var chat = await this.baseService.getInvitation(fileurl);
        var chatUrl = chat.ievent;
        const recipient = chat.interlocutor;
        const ids = chat.agent;
        const friendIds = ids.replace("----" + userWebId, "").split("----");
        this.uploader.deleteFileForUser(fileurl);
        return {
            friendIds,
            chatUrl,
            invitationUrl: fileurl,
            recipient
        };
    }
}
module.exports = JoinChatService;