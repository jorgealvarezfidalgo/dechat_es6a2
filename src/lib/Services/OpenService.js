const Service = require("./Service");
const BaseService = require("./BaseService");

/**
 * Encapsulates all functionality related with the opening of a chat
 */
class OpenService extends Service {
    constructor(fetch) {
        super(fetch);
        this.baseService = new BaseService(this.auth.fetch);
    }

    /**
     * This method returns all the chats that a user can open, looking at the encrypted file chatStorage.ttl
     * Each object contains the url of the chat (chatUrl) and the url where the data of the chat is stored (storeUrl).
     * @param webid: the WebId of the current user.
     * @returns {Promise}: a promise that resolves to an array with objects representing chats.
     */
    async getChatsToOpen(webid) {
        var url = webid.replace("profile/card#me", "private/chatsStorage.ttl");
        this.baseService.writePermission(url);
        const deferred = this.Q.defer();
        const rdfjsSource = await this.rdfjsSourceFromUrl(url, this.fetch);
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
                    result.bindingsStream.on("data", async (data) => {
                        const deferred = this.Q.defer();
                        promises.push(deferred.promise);
                        data = data.toObject();
                        chatUrls.push({
                            chatUrl: data["?chat"].value,
                            storeUrl: self.encrypter.decrypt(data["?url"].value.split("private/").pop(), false),
                            interlocutor: self.encrypter.decrypt(data["?int"].value.split("private/").pop(), false)
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

    /**
     * Calls Loader to load data from the selected chat to open and returns it.
     * @param {string} url: url of the chat.
     * @param {string} userWebId: WebId of current user.
     * @param {string} userDataUrl: url of the directory.
     * @param {string} interloc: WebId of interlocutor.
     * @returns {Promise}: a promises that resolves with a SemanticChat/Group.
     */
    async loadChatFromUrl(url, userWebId, userDataUrl, interloc) {
        this.loader.setEncrypter(this.encrypter);
        if (interloc.includes("Group")) {
            return await this.loader.loadGroupFromUrl(url, userWebId, userDataUrl);
        } else {
            return await this.loader.loadChatFromUrl(url, userWebId, userDataUrl);
        }
    }
}
module.exports = OpenService;