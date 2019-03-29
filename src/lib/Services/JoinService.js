const N3 = require('n3');
const Q = require('q');
//const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('../namespaces');
const uniqid = require('uniqid');
const winston = require('winston');
const URI = require('uri-js');
const auth = require('solid-auth-client');
const {
    format
} = require("date-fns");
const rdfjsSourceFromUrl = require('../Repositories/rdfjssourcefactory').fromUrl;
const BaseService = require('./BaseService');
const CreateService = require('./CreateService');
const Uploader = require('../Repositories/SolidUploaderRepository');
const SemanticChat = require('../semanticchat');
const Group = require('../Group');

let uploader = new Uploader(auth.fetch);

let baseService = new BaseService(auth.fetch);
let createService = new CreateService(auth.fetch);

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

    async joinExistingChat(userDataUrl, interlocutorWebId, userWebId, urlChat, name, members) {
        var recipient = interlocutorWebId;
        var participants = [];
        console.log("A");
        if (interlocutorWebId.includes("Group")) {
            recipient = userWebId.split("card")[0] + "Group/" + name.replace(/ /g, "U+0020");
            participants = members;
        } else {
            participants.push(recipient);
        }
        console.log("B");
        participants.forEach(async mem => {
            console.log("Guardando en POD B a: " + mem);
            var invitation = await createService.generateInvitation(userDataUrl, urlChat, userWebId, mem);
            console.log(invitation);
            try {
                await uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA{${invitation}}`);
            } catch (e) {
                logger.error(`Could not add chat to WebId.`);
            }
        });
        console.log(recipient);
        try {
            await uploader.executeSPARQLUpdateForUser(userWebId.replace("profile/card#me", "private/chatsStorage.ttl"), `INSERT DATA { <${urlChat}> <${namespaces.schema}contributor> <${userWebId}>;
    			<${namespaces.schema}recipient> <${recipient}>;
    			<${namespaces.storage}storeIn> <${userDataUrl}>.}`);
        } catch (e) {
            logger.error(`Could not add chat to WebId.`);
        }
    }

    async processChatToJoin(chat, fileurl, userWebId, userDataUrl) {
        console.log("Info to join:");
        console.log(chat);
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
        console.log("Chat processed");
        console.log(chatJoined);
        return chatJoined;
    }
    async getJoinRequest(fileurl, userWebId) {
        console.log(fileurl);
        var chat = await baseService.getInvitation(fileurl);
        var chatUrl = chat.ievent;
        console.log(chatUrl);
        const recipient = chat.interlocutor;
        console.log(recipient);
        const ids = chat.agent;
        console.log("IDS:" + ids);
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
