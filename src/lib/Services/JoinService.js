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


  /**
   * This method checks a file and looks for the a join request.
   * @param fileurl: the url of the file in which to look.
   * @param userWebId: the WebId of the user looking for requests.
   * @returns {Promise}: a promise that resolves with {interlocutorWebId: string, gchatrl: string, invitationUrl: string},
   * where interlocutorWebId is the WebId of the player that initiated the request, gchatrl is the url of the gchat and
   * invitationUrl is the url of the invitation.
   * If no request was found, null is returned.
   */
  async getJoinRequest(fileurl, userWebId, selfCore) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();
      let invitationFound = false;
      const self = selfCore;

      engine.query(`SELECT ?invitation {
      ?invitation a <${namespaces.schema}InviteAction>.
    }`, {
          sources: [{
            type: 'rdfjsSource',
            value: rdfjsSource
          }]
        })
        .then(function(result) {
          result.bindingsStream.on('data', async function(result) {

            invitationFound = true;
            result = result.toObject();
            //console.log(result);
            const invitationUrl = result['?invitation'].value;
            let chatUrl = invitationUrl.split("#")[0];
            if (!chatUrl) {
              chatUrl = await self.getChatFromInvitation(invitationUrl);

              if (chatUrl) {
                self.logger.info('chat: found by using Comunica directly, but not when using LDflex. Caching issue (reported).');
              }
            }
            //console.log(chatUrl);

            if (!chatUrl) {
              deferred.resolve(null);
            } else {
              //console.log(invitationUrl);
              const recipient = await baseService.getObjectFromPredicateForResource(invitationUrl, namespaces.schema + 'recipient');
              //console.log("Recipient: " + recipient);
              if (!recipient || recipient.value !== userWebId) {
                deferred.resolve(null);
              }

              const friendWebId = await baseService.getObjectFromPredicateForResource(invitationUrl, namespaces.schema + 'agent');
              //console.log("Agent: " + friendWebId);

              deferred.resolve({
                friendWebId,
                chatUrl,
                invitationUrl
              });
            }
          });

          result.bindingsStream.on('end', function() {
            if (!invitationFound) {
              console.log("NO");
              deferred.resolve(null);
            }
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }


  async joinExistingChat(urlChat, invitationUrl, interlocutorWebId, userWebId, userDataUrl, fileUrl, logger) {
    const chatUrl = urlChat;
    try {
      await uploader.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${chatUrl}> <${namespaces.schema}contributor> <${userWebId}>;
    			<${namespaces.schema}recipient> <${interlocutorWebId}>;
    			<${namespaces.storage}storeIn> <${userDataUrl}>.}`);
    } catch (e) {
      logger.error(`Could not add chat to WebId.`);
      logger.error(e);
    }
    uploader.deleteFileForUser(fileUrl);
  }


  async processChatToJoin(chat, fileurl) {
    chat.fileUrl = fileurl;
    chat.name = "Chat de ";
    chat.interlocutorName = await baseService.getFormattedName(chat.friendWebId.id);
    return chat;
  }

   /**
   * This method returns the chat of an invitation.
   * @param url: the url of the invitation.
   * @returns {Promise}: a promise that returns the url of the chat (NamedNode) or null if none is found.
   */
  async getChatFromInvitation(url) {
    return baseService.getObjectFromPredicateForResource(url, namespaces.schema + 'event');
}



}
module.exports = JoinChatService;
