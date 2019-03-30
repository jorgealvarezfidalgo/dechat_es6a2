const Service = require("./Service");

class JoinChatService extends Service {
    constructor(fetch) {
        super(fetch);
    }

    async joinExistingChat(userDataUrl, interlocutorWebId, userWebId, urlChat, name, members) {
        var recipient = interlocutorWebId;
        var participants = [];
        //console.log("A");
        if (interlocutorWebId.includes("Group")) {
            recipient = userWebId.split("card")[0] + "Group/" + name.replace(/ /g, "U+0020");
            participants = members;
        } else {
            participants.push(recipient);
        }
        //console.log("B");
        participants.forEach(async (mem) => {
            //console.log("Guardando en POD B a: " + mem);
            var invitation = await createService.generateInvitation(userDataUrl, urlChat, userWebId, mem);
            //console.log(invitation);
            try {
                await uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA{${invitation}}`);
            } catch (e) {
                logger.error("Could not add chat to WebId.");
            }
        });
        //console.log(recipient);
        try {
            await uploader.executeSPARQLUpdateForUser(userWebId.replace("profile/card#me", "private/chatsStorage.ttl"), `INSERT DATA { <${urlChat}> <${namespaces.schema}contributor> <${userWebId}>;
    			<${namespaces.schema}recipient> <${recipient}>;
    			<${namespaces.storage}storeIn> <${userDataUrl}>.}`);
        } catch (e) {
            logger.error("Could not add chat to WebId.");
        }
    }

    async processChatToJoin(chat, fileurl, userWebId, userDataUrl) {
        //console.log("Info to join:");
        //console.log(chat);
        var chatJoined = null;
        if (chat.friendIds[0].includes("Group")) {
            var name = chat.friendIds[0].split("/").pop();
            chat.friendIds.splice(0, 1);
            chatJoined = new Group({
                url: fileurl,
                chatBaseUrl: userDataUrl,
                userWebId,
                members: chat.friendIds,
                interlocutorName: name.replace(/U\+0020/g, " "),
                interlocutorWebId: "Group/" + name.replace(/U\+0020/g, " "),
                photo: "main/resources/static/img/group.jpg"
            });
        } else {
            chatJoined = new SemanticChat({
                url: fileurl,
                messageBaseUrl: userDataUrl,
                userWebId,
                interlocutorWebId: chat.friendIds[0],
                interlocutorName: await baseService.getFormattedName(chat.friendIds[0])
            });
        }
        //console.log("Chat processed");
        //console.log(chatJoined);
        return chatJoined;
    }
    async getJoinRequest(fileurl, userWebId) {
        //console.log(fileurl);
        var chat = await baseService.getInvitation(fileurl);
        var chatUrl = chat.ievent;
        //console.log(chatUrl);
        const recipient = chat.interlocutor;
        //console.log(recipient);
        const ids = chat.agent;
        //console.log("IDS:" + ids);
        const friendIds = ids.replace("----" + userWebId, "").split("----");
        uploader.deleteFileForUser(fileurl);
        return {
            friendIds,
            chatUrl,
            invitationUrl: fileurl,
            recipient
        };
    }
}
module.exports = JoinChatService;
