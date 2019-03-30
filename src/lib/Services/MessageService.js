const Service = require("./Service");
const BaseService = require("./BaseService");

let baseService = new BaseService(auth.fetch);

class MessageService  extends Service {
    constructor(fetch) {
        super(fetch);
    }


  async getNewMessage(fileurl, userWebId) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();
      let messageFound = false;
      engine.query(`SELECT * {
  				?message a <${namespaces.schema}Message>;
  					<${namespaces.schema}dateSent> ?time;
  					<${namespaces.schema}givenName> ?username;
  					<${namespaces.schema}text> ?msgtext.
  			}`, {
          sources: [{
            type: "rdfjsSource",
            value: rdfjsSource
          }]
        })
        .then(function(result) {
          result.bindingsStream.on("data", async function(result) {
            messageFound = true;
            result = result.toObject();
            const messageUrl = result["?message"].value;
            const messagetext = result["?msgtext"].value.split("/inbox/")[1].replace(/U\+0020/g, " ").replace(/U\+003A/g, ":");
            const author = result["?username"].value.replace(/U\+0020/g, " ");
            const time = result["?time"].value.split("/")[4];
            const inboxUrl = fileurl;
            deferred.resolve({
              inboxUrl,
              messagetext,
              messageUrl,
              author,
              time
            });
          });

          result.bindingsStream.on("end", function() {
            if (!messageFound) {
              deferred.resolve(null);
            }
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  async storeMessage(userDataUrl, username, userWebId, time, message, interlocutorWebId, toSend, members) {
    const messageTx = message.replace(/ /g, "U+0020").replace(/:/g, "U+003A");
    const psUsername = username.replace(/ /g, "U+0020");

    const messageUrl = await baseService.generateUniqueUrlForResource(userDataUrl);
    const sparqlUpdate = `
		<${messageUrl}> a <${namespaces.schema}Message>;
		  <${namespaces.schema}dateSent> <${time}>;
		  <${namespaces.schema}givenName> <${psUsername}>;
		  <${namespaces.schema}text> <${messageTx}>.`;
    try {
      await uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${sparqlUpdate}}`);
    } catch (e) {
      this.logger.error("Could not save new message.");
      this.logger.error(e);
    }
    if (toSend) {
		var ids = [];
		if(members) {
			ids = members;
		}
		else {
			ids.push(interlocutorWebId);
		}
		//console.log(ids);
		if(ids.length < 2) {
			await uploader.sendToInterlocutorInbox(await baseService.getInboxUrl(ids[0]), sparqlUpdate);
		}
		else {
			ids.forEach(async (id) => {
			try {
				if(id.value) {
  					await uploader.sendToInterlocutorInbox(await baseService.getInboxUrl(id.value), sparqlUpdate);
				}
  				else {
  				  await uploader.sendToInterlocutorInbox(await baseService.getInboxUrl(id), sparqlUpdate);
				}
			} catch (e) {
			this.logger.error("Could not send message to interlocutor.");
			this.logger.error(e);
		}});
		}
    }

  }
}
module.exports = MessageService;
