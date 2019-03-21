const N3 = require('n3');
const Q = require('q');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('../namespaces');
const uniqid = require('uniqid');
const winston = require('winston');
const URI = require('uri-js');
const auth = require('solid-auth-client');
const {
    format
} = require('date-fns');
const rdfjsSourceFromUrl = require('../Repositories/rdfjssourcefactory').fromUrl;
const BaseService = require('./BaseService');
const Uploader = require('../Repositories/SolidUploaderRepository');
const SemanticChat = require('../semanticchat');
const Group = require('../Group');

let uploader = new Uploader(auth.fetch);

let baseService = new BaseService(auth.fetch);

class JoinChatService {
    constructor(fetch) {
        this.fetch = fetch;
        this.logger = winston.createLogger({
            level: 'error',
            transports: [
                new winston.transports.Console(),
            ],
            format: winston.format.cli()
        });
    }


    async joinExistingChat(urlChat, invitationUrl, interlocutorWebId, userWebId, userDataUrl, logger) {
        const chatUrl = urlChat;
        try {
            await uploader.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${chatUrl}> <${namespaces.schema}contributor> <${userWebId}>;
    			<${namespaces.schema}recipient> <${interlocutorWebId}>;
    			<${namespaces.storage}storeIn> <${userDataUrl}>.}`);
        } catch (e) {
            logger.error(`Could not add chat to WebId.`);
            logger.error(e);
        }

    }


    async processChatToJoin(chat, fileurl, userWebId, userDataUrl) {
		console.log("Info to join:");
		console.log(chat);
        var chatJoined;
        if (chat.friendIds[0].includes("Group")) {
            var name = chat.friendIds[0].split("/").pop();
            chat.friendIds.splice(0, 1);
            chatJoined = new Group({
                url: fileurl,
                messageBaseUrl: userDataUrl,
                userWebId,
                members: chat.friendIds,
                interlocutorName: name,
                photo: "main/resources/static/img/group.png"
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
		console.log("Chat processed");
		console.log(chatJoined);

        return chatJoined;
    }

    async getJoinRequestB(fileurl) {
		console.log(fileurl);
		var chat = await baseService.getInvitation(fileurl);
        var chatUrl = chat.ievent;
		console.log(chatUrl);
        const recipient = chat.interlocutor;
		console.log(recipient);
        const ids = chat.agent;
		console.log("IDS:" + ids);
		const friendIds = ids.split("----"); 
        //uploader.deleteFileForUser(fileUrl);

        return {
            friendIds,
            chatUrl,
            invitationUrl: fileurl,
			recipient
        };
    }

}
module.exports = JoinChatService;