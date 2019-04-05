const Service = require("./Service");
const BaseService = require("./BaseService");

class MessageService  extends Service {

    constructor(fetch) {
        super(fetch);
		    this.baseService = new BaseService(this.auth.fetch);
    }


  async getNewMessage(fileurl, userWebId) {
    const deferred = this.Q.defer();
    const rdfjsSource = await this.rdfjsSourceFromUrl(fileurl, this.fetch);

    if (rdfjsSource) {
      const engine = this.newEngine();
      let messageFound = false;
	    const self = this;
      engine.query(`SELECT * {
  				?message a <${self.namespaces.schema}Message>;
  					<${self.namespaces.schema}dateSent> ?time;
  					<${self.namespaces.schema}givenName> ?username;
  					<${self.namespaces.schema}text> ?msgtext.
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
            var messageT;
            if(result["?msgtext"].value.includes("data:image")
                  || result["?msgtext"].value.includes("data:video")
            ){
                      messageT = result["?msgtext"].value;
            }
            else{
              messageT = result["?msgtext"].value.split("/inbox/")[1].replace(/U\+0020/g, " ").replace(/U\+003A/g, ":");
            }
            const messagetext = messageT;
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
    var messageT;

    if(message.includes("data:image")
        || message.includes("data:video")
    ){
      messageT = message;
    } else{
      messageT = message.replace(/ /g, "U+0020").replace(/:/g, "U+003A");
    }
    const messageTx = messageT;
    /*if( messageTx.includes("data:video")){
        console.log("msg stored in msg service is" + messageTx);
    }*/
    const psUsername = username.replace(/ /g, "U+0020");
    const messageUrl = await this.baseService.generateUniqueUrlForResource(userDataUrl);


    const sparqlUpdate = `
		<${messageUrl}> a <${this.namespaces.schema}Message>;
		  <${this.namespaces.schema}dateSent> <${time}>;
		  <${this.namespaces.schema}givenName> <${psUsername}>;
		  <${this.namespaces.schema}text> <${messageTx}>.`;
    try {
      await this.uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${sparqlUpdate}}`);
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
			await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(ids[0]), sparqlUpdate);
		}
		else {
			ids.forEach(async (id) => {
			try {
				if(id.value) {
  					await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(id.value), sparqlUpdate);
				}
  				else {
  				  await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(id), sparqlUpdate);
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
