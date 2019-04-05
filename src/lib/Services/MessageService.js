const Service = require("./Service");
const BaseService = require("./BaseService");
const CryptoJS = require("crypto-js");

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
			  console.log(result);
			  //.replace(/U\+0020/g, " ").replace(/U\+003A/g, ":") for text
            messageFound = true;
            result = result.toObject();
            const messageUrl = result["?message"].value;
            const messagetext = self.encrypter.decrypt(result["?msgtext"].value.split("/inbox/")[1], true).replace(/U\+0020/g, " ").replace(/U\+003A/g, ":");
            const author = self.encrypter.decrypt(result["?username"].value, true).replace(/U\+0020/g, " ");
			var tmFields = result["?time"].value.split("/");
            const time = self.encrypter.decrypt(tmFields.splice(4, tmFields.length).join("/"), true);
			console.log("Time: " + time);
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
    //const messageTx = message.replace(/ /g, "U+0020").replace(/:/g, "U+003A");
    //const psUsername = username.replace(/ /g, "U+0020");
	
	var enctime = this.encrypter.encrypt(time, false);
	var encuser = this.encrypter.encrypt(username, false);
	var enctx = this.encrypter.encrypt(message, false);

    const messageUrl = await this.baseService.generateUniqueUrlForResource(userDataUrl);
    const forpriv = `
		<${messageUrl}> a <${this.namespaces.schema}Message>;
		  <${this.namespaces.schema}dateSent> <${enctime}>;
		  <${this.namespaces.schema}givenName> <${encuser}>;
		  <${this.namespaces.schema}text> <${enctx}>.`;
		  
	enctime = this.encrypter.encrypt(time, true);
	encuser = this.encrypter.encrypt(username, true);
	enctx = this.encrypter.encrypt(message, true);
	
	const forinbox = `
		<${messageUrl}> a <${this.namespaces.schema}Message>;
		  <${this.namespaces.schema}dateSent> <${enctime}>;
		  <${this.namespaces.schema}givenName> <${encuser}>;
		  <${this.namespaces.schema}text> <${enctx}>.`;
	
    try {
      await this.uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${forpriv}}`);
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
			await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(ids[0]), forinbox);
		}
		else {
			ids.forEach(async (id) => {
			try {
				if(id.value) {
  					await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(id.value), forinbox);
				}
  				else {
  				  await this.uploader.sendToInterlocutorInbox(await this.baseService.getInboxUrl(id), forinbox);
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
