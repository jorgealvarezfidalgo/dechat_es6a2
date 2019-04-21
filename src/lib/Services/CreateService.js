const Service = require("./Service");
const BaseService = require("./BaseService");

class CreateService extends Service {
	
    constructor(fetch) {
        super(fetch);
		this.baseService = new BaseService(this.auth.fetch);
    }

    /**
     * This method creates a new chat
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

        //console.log(group);

        await this.setUpNew(chatUrl, userDataUrl, userWebId, interlocutorWebIds, group, userWebId.split("card")[0] + "Group/" + friendName.replace(/ /g, "U+0020"));

        return group;
    }

    async setUpNew(chatUrl, userDataUrl, userWebId, interlocutorWebIds, semanticChat, firstId) {

        //console.log("Setting up new");

        try {
            await this.uploader.executeSPARQLUpdateForUser(userWebId.replace("profile/card#me","private/chatsStorage.ttl"), `INSERT DATA { <${chatUrl}> <${this.namespaces.schema}contributor> <${userWebId}>;
			<${this.namespaces.schema}recipient> <${firstId}>;
			<${this.namespaces.storage}storeIn> <${userDataUrl}>.}`);
        } catch (e) {
            this.logger.error("Could not add chat to WebId.");
            this.logger.error(e);
        }
        await this.storeAndSendInvitations(userDataUrl, userWebId, interlocutorWebIds, semanticChat);
    }

    async storeAndSendInvitations(userDataUrl, userWebId, interlocutorWebIds, semanticChat) {
        var id = userWebId;
        //console.log(id);
        interlocutorWebIds.forEach(async (interlocutorWebId) => {

            if (interlocutorWebIds.length > 1) {
                //console.log("Procesando");
                id = "Group/" + semanticChat.interlocutorName.replace(/ /g, "U+0020") + "----" + userWebId;
                interlocutorWebIds.forEach(async interlocWebId => {
                    if (interlocWebId !== interlocutorWebId) {
						//console.log(interlocWebId);
						//console.log(interlocWebId.id ? interlocWebId.id : interlocWebId);
                        id += "----" + (interlocWebId.id ? interlocWebId.id : interlocWebId);
                    }
                });

            }
            //console.log(id);

            //console.log("Invitando: " + interlocutorWebId);
            var invitation = await this.generateInvitation(userDataUrl, semanticChat.getUrl(), id, (interlocutorWebId.id ? interlocutorWebId.id : interlocutorWebId));
            //console.log(invitation);
            try {
                await this.uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA{${invitation}}`);
            } catch (e) {
                //console.log("?");
                logger.error("Could not add chat to WebId.");
                logger.error(e);
            }
            try {
                await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(interlocutorWebId.id ? interlocutorWebId.id : interlocutorWebId), invitation);
            } catch (e) {
                this.logger.error("Could not send invitation to interlocutor.");
                this.logger.error(e);
            }
        });
    }


    async generateInvitation(baseUrl, chatUrl, userWebId, interlocutorWebId) {
        const invitationUrl = await this.baseService.generateUniqueUrlForResource(baseUrl);
        ////console.log(invitationUrl);
        const sparqlUpdate = `
    <${invitationUrl}> a <${this.namespaces.schema}InviteAction>;
      <${this.namespaces.schema}event> <${chatUrl}>;
      <${this.namespaces.schema}agent> <${userWebId}>;
      <${this.namespaces.schema}recipient> <${interlocutorWebId}>.
  `;

        return sparqlUpdate;
    }


}

module.exports = CreateService;
