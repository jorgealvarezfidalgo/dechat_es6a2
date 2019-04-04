const Service = require("./Service");
const BaseService = require("./BaseService");

class OpenService extends Service {
    constructor(fetch) {
        super(fetch);
		this.baseService = new BaseService(this.auth.fetch);
    }

  /**
   * This method returns all the chats that a user can continue, based on his WebId.
   * @param webid: the WebId of the player.
   * @returns {Promise}: a promise that resolves to an array with objects.
   * Each object contains the url of the chat (chatUrl) and the url where the data of the chat is store (storeUrl).
   */
  async getChatsToOpen(webid) {
	var url = webid.replace("profile/card#me","private/chatsStorage.ttl");
	this.baseService.writePermission(url);
    const deferred = this.Q.defer();
    const rdfjsSource = await this.rdfjsSourceFromUrl(url, this.fetch);
	console.log(rdfjsSource);
    if (rdfjsSource) {
      const engine = this.newEngine();
      const chatUrls = [];
      const promises = [];
	  const self = this;

      engine.query(`SELECT ?chat ?int ?url {
  			 ?chat <${self.namespaces.schema}contributor> ?id;
  				<${self.namespaces.schema}recipient> ?int;
  				<${self.namespaces.storage}storeIn> ?url.
  		  }`, {
          sources: [{
            type: "rdfjsSource",
            value: rdfjsSource
          }]
        })
        .then((result) => {
			console.log(result);
          result.bindingsStream.on("data", async (data) => {
            const deferred = this.Q.defer();
            promises.push(deferred.promise);
            data = data.toObject();
            chatUrls.push({
              chatUrl: data["?chat"].value,
              storeUrl: self.encrypter.decrypt(data["?url"].value, false),
              interlocutor: self.encrypter.decrypt(data["?int"].value, false)
            });
            deferred.resolve();
          });

          result.bindingsStream.on("end", function() {
            self.Q.all(promises).then(() => {
              console.log(chatUrls);
              deferred.resolve(chatUrls);
            });
          });
        });
    } else {
      deferred.resolve(null);
    }
	
    return deferred.promise;
  }

  async loadChatFromUrl(url, userWebId, userDataUrl, interloc) {
	this.loader.setEncrypter(this.encrypter);
	if(interloc.includes("Group")) {
		return await this.loader.loadGroupFromUrl(url, userWebId, userDataUrl);
	} else {
		return await this.loader.loadChatFromUrl(url, userWebId, userDataUrl);
	}
  }
}
module.exports = OpenService;
