const Service = require("./Service");

class OpenService extends Service {
    constructor(fetch) {
        super(fetch);
    }

  /**
   * This method returns all the chats that a user can continue, based on his WebId.
   * @param webid: the WebId of the player.
   * @returns {Promise}: a promise that resolves to an array with objects.
   * Each object contains the url of the chat (chatUrl) and the url where the data of the chat is store (storeUrl).
   */
  async getChatsToOpen(webid) {
	var url = webid.replace("profile/card#me","private/chatsStorage.ttl");
	baseService.writePermission(url);
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(url, this.fetch);
    if (rdfjsSource) {
      const engine = newEngine();
      const chatUrls = [];
      const promises = [];

      engine.query(`SELECT ?chat ?int ?url {
  			 ?chat <${namespaces.schema}contributor> <${webid}>;
  				<${namespaces.schema}recipient> ?int;
  				<${namespaces.storage}storeIn> ?url.
  		  }`, {
          sources: [{
            type: "rdfjsSource",
            value: rdfjsSource
          }]
        })
        .then((result) => {
          result.bindingsStream.on("data", async (data) => {
            const deferred = Q.defer();
            promises.push(deferred.promise);
            data = data.toObject();
            chatUrls.push({
              chatUrl: data["?chat"].value,
              storeUrl: data["?url"].value,
              interlocutor: data["?int"].value
            });
            deferred.resolve();
          });

          result.bindingsStream.on("end", function() {
            Q.all(promises).then(() => {
              ////console.log(chatUrls);
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
	if(interloc.includes("Group")) {
		return await loader.loadGroupFromUrl(url, userWebId, userDataUrl);
	} else {
		return await loader.loadChatFromUrl(url, userWebId, userDataUrl);
	}
  }
}
module.exports = OpenService;
