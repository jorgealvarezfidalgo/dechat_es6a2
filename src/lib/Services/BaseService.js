const Service = require("./Service");
const fileClient = require("solid-file-client");

class BaseService extends Service {
    constructor(fetch) {
        super(fetch);
    }
	
	async checkPrivate(webid) {
		var url = webid.replace("profile/card#me", "private");
		var priv = await fileClient.readFolder(url).then(folder => {
			console.log(`Read ${folder.name}, it has ${folder.files.length} files.`);
		}, err => console.log(err) );
		console.log(priv);
		if(priv === null) {
			await fileClient.createFolder(url).then(success => {
				console.log(`Created folder ${url}.`);
			}, err => console.log(err) );
		}
	}

    /**
     * This method returns a formatted name for a WebId.
     * @param webid: the WebId for which a formatted name needs to be created.
     * @returns {Promise<string|null>}: a promise that resolvew with the formatted name (string) or
     * null if no name details were found.
     */
    async getFormattedName(webid) {
        if (webid.includes("Group")) {
            return webid.split("Group/").pop().replace(/U\+0020/g, " ");
		}
        let formattedName = await this.getObjectFromPredicateForResource(webid, this.namespaces.foaf + "name");

        if (!formattedName) {
                formattedName = webid;
        } else {
            formattedName = formattedName.value;
        }
        return formattedName;
    }

    async getPhoto(webid) {
        let photoUrl = await this.getObjectFromPredicateForResource(webid, "http://www.w3.org/2006/vcard/ns#hasPhoto");
        if (photoUrl) {
            return photoUrl.value;
		}
        else {
            return null;
		}
    }

    async getNote(webid) {
        let noteUrl = await this.getObjectFromPredicateForResource(webid, "http://www.w3.org/2006/vcard/ns#note");
        if (noteUrl) {
            return noteUrl.value;
		}
        else {
            return null;
		}
    }

    /**
     * This method returns the object of resource via a predicate.
     * @param url: the url of the resource.
     * @param predicate: the predicate for which to look.
     * @returns {Promise}: a promise that resolves with the object or null if none is found.
     */
    async getObjectFromPredicateForResource(url, predicate) {
        const deferred = this.Q.defer();
        const rdfjsSource = await this.rdfjsSourceFromUrl(url, this.fetch);
        if (rdfjsSource) {
            const engine = this.newEngine();
            engine.query(`SELECT ?o {
    <${url}> <${predicate}> ?o.
  }`, {
                sources: [{
                    type: "rdfjsSource",
                    value: rdfjsSource
                }]
            })
                .then(function (result) {
                    result.bindingsStream.on("data", function (data) {
                        data = data.toObject();

                        deferred.resolve(data["?o"]);
                    });

                    result.bindingsStream.on("end", function () {
                        deferred.resolve(null);
                    });
                });
        } else {
            deferred.resolve(null);
        }

        return deferred.promise;
    }

    getDefaultDataUrl(webId) {
        const parsedWebId = this.URI.parse(webId);
        const today = this.format(new Date(), "yyyyMMddhhmm");

        return `${parsedWebId.scheme}://${parsedWebId.host}/private/dechat_${today}.ttl`;
    }

    async writePermission(url) {
        const response = await this.uploader.executeSPARQLUpdateForUser(url, "INSERT DATA {}");
        return response.status === 200;
    }

    getDefaultFriendPhoto() {
        return "main/resources/static/img/friend_default.jpg";
    }

    async generateUniqueUrlForResource(baseurl) {
        let url = baseurl + "#" + this.uniqid();

        return url;
    }

    async getInboxUrl(webId) {
        if (!this.inboxUrls[webId]) {
            this.inboxUrls[webId] = (await this.getObjectFromPredicateForResource(webId, this.namespaces.ldp + "inbox")).value;
        }
        return this.inboxUrls[webId];
    }

    /**
     * This method check an inbox for new notifications.
     * @param inboxUrl: the url of the inbox.
     * @returns {Promise}: a promise that resolves with an array containing the urls of all new notifications since the last time
     * this method was called.
     */
    async checkUserInboxForUpdates(inboxUrl) {
        const deferred = this.Q.defer();
        const newResources = [];
        const rdfjsSource = await this.rdfjsSourceFromUrl(inboxUrl, this.fetch);
        const self = this;
        const engine = this.newEngine();
        engine.query(`SELECT ?resource {
      ?resource a <http://www.w3.org/ns/ldp#Resource>.
    }`, {
            sources: [{
                type: "rdfjsSource",
                value: rdfjsSource
            }]
        })
            .then(function (result) {
                result.bindingsStream.on("data", (data) => {
                    data = data.toObject();

                    const resource = data["?resource"].value;
                    ////console.log(resource);
                    if (self.alreadyCheckedResources.indexOf(resource) === -1) {
                        newResources.push(resource);
                        self.alreadyCheckedResources.push(resource);
                    }
                });

                result.bindingsStream.on("end", function () {
                    deferred.resolve(newResources); });
				});
        return deferred.promise;
    }

    async getInvitation(fileurl) {
        const deferred = this.Q.defer();
        const rdfjsSource = await this.rdfjsSourceFromUrl(fileurl, this.fetch);
        if (rdfjsSource) {
            const engine = this.newEngine();
            let invitationFound = false;
            const self = this;
			var sselect = `SELECT * {
				?invitation a <${this.namespaces.schema}InviteAction>; 
					<${this.namespaces.schema}agent> ?sender; 
					<${this.namespaces.schema}event> ?chaturl;
					<${this.namespaces.schema}recipient> ?interlocutor.}`;
            engine.query(sselect, { sources: [{ type: "rdfjsSource", value: rdfjsSource }]
            }).then(function (result) {
                    result.bindingsStream.on("data", async function (result) {
                        invitationFound = true;
                        result = result.toObject();
						console.log(result);
						var inFields = result["?interlocutor"].value.split("/");
						var agFields = result["?sender"].value.split("/");
						var ieFields = result["?chaturl"].value.split("/");
                        deferred.resolve({
							interlocutor: self.encrypter.decrypt(inFields.splice(4, inFields.length).join("/"), true), 
							url: self.encrypter.decrypt(result["?invitation"].value, true), 
							agent: self.encrypter.decrypt(agFields.splice(4, agFields.length).join("/"), true), 
							ievent: self.encrypter.decrypt(ieFields.splice(4, ieFields.length).join("/"), true)
							});
						});
                    result.bindingsStream.on("end", function () {
                        if (!invitationFound) {
                            deferred.resolve(null);
                        }});
                });
        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }
    deleteFileForUser(url) {
        this.uploader.deleteFileForUser(url);
    }}
module.exports = BaseService;
