const n3 = require("n3");
const newEngine = require("@comunica/actor-init-sparql-rdfjs").newEngine;
const Q = require("q");
const streamify = require("streamify-array");
const namespaces = require("../namespaces");
const SemanticChat = require("../semanticchat");
const Group = require("../Group");

/**
 * The Loader allows creating a Semantic Chat instance via information loaded from an url.
 */
class SolidLoaderRepository {

    /**
     * This constructor creates an instance of Loader.
     * @param fetch: the function used to fetch the data
     */
    constructor(fetch) {
        this.engine = newEngine();
        this.fetch = fetch;
    }

    /**
     * Creates a SemanticChat and redirects to loadFromUrl to load its data.
     * @param {string} chatUrl: chat URL.
     * @param {string} userWebId: WebId from the requesting user.
     * @param {string} chatBaseUrl: base URL of the Chat.
     * @returns {Promise}: a promise that resolves with the SemanticChat loaded from the POD.
     */
    async loadChatFromUrl(chatUrl, userWebId, chatBaseUrl) {
        const chat = new SemanticChat({
            url: chatUrl,
            chatBaseUrl,
            userWebId
        });
        return await this.loadFromUrl(chat, chatUrl);
    }

    /**
     * Creates a Group and redirects to loadFromUrl to load its data.
     * @param {string} chatUrl: chat URL.
     * @param {string} userWebId: WebId from the requesting user.
     * @param {string} chatBaseUrl: base URL of the Chat.
     * @returns {Promise}: a promise that resolves with the Group loaded from the POD.
     */
    async loadGroupFromUrl(chatUrl, userWebId, chatBaseUrl) {

        var ids = await this.findWebIdOfInterlocutor(chatUrl, userWebId);

        const chat = new Group({
            url: chatUrl,
            chatBaseUrl,
            userWebId,
            members: ids
        });

        return await this.loadFromUrl(chat, chatUrl);
    }

    /**
     * Finds all messages contained within chat URL and loads them into the SemanticChat/Group.
     * @param {string} chatUrl: chat URL.
     * @param {string} chat: instance of SemanticChat.
     * @returns {SemanticChat}: an instance of SemanticChat with messages loaded.
     */
    async loadFromUrl(chat, chatUrl) {

        //console.log("Loading from url");

        const messages = await this._findMessage(chatUrl);

        for (var i = 0, len = messages.length; i < len; i++) {
            chat.loadMessage(messages[i]);
        }
        return chat;
    }

    /**
     * Finds all Messages in a URL.
     * @param {string} messageUrl: URL to inspect.
     * @returns {Promise}: a promise that resolves with an array of all messages found.
     */
    async _findMessage(messageUrl) {
        const deferred = Q.defer();
        let results = [];

        const rdfjsSource = await this._getRDFjsSourceFromUrl(messageUrl);
        let nextMessageFound = false;
        const self = this;
        this.engine.query(`SELECT * {
		?message a <${namespaces.schema}Message>;
		<${namespaces.schema}dateSent> ?time;
		<${namespaces.schema}givenName> ?username;
		<${namespaces.schema}text> ?msgtext. }`, {
                sources: [{
                    type: "rdfjsSource",
                    value: rdfjsSource
                }]
            })
            .then(function(result) {
                result.bindingsStream.on("data", (data) => {
                    data = data.toObject();

                    if (data["?msgtext"]) {
                        if (data["?msgtext"].value.includes("data:image") ||
                            data["?msgtext"].value.includes("data:video") ||
                            data["?msgtext"].value.includes("data:text")
                        ) {
                            var messageText = data["?msgtext"].value;
                            var author = data["?username"].value.split("/").pop();
                            results.push({
                                messagetext: messageText,
                                url: data["?message"].value,
                                author: author.replace(/U\+0020/g, " "),
                                time: data["?time"].value.split("/")[4]
                            });
                        } else {
                            var txFields = data["?msgtext"].value.split("/");
                            var auFields = data["?username"].value.split("/");
                            var tmFields = data["?time"].value.split("/");
                            var messageText = self.encrypter.decrypt(txFields.splice(4, txFields.length).join("/"), false);
                            var authorr = self.encrypter.decrypt(auFields.splice(4, auFields.length).join("/"), false);

                            results.push({
                                messagetext: messageText,
                                url: data["?message"].value,
                                author: authorr,
                                time: self.encrypter.decrypt(tmFields.splice(4, tmFields.length).join("/"), false)
                            });
                        }
                    }
                });

                result.bindingsStream.on("end", function() {
                    deferred.resolve(results);
                });
            });

        return deferred.promise;
    }

    /**
     * Finds all interlocutors WebIds by looking for Invitations sent.
     * @param {string} chatUrl: URL to inspect.
     * @returns {Promise}: a promise that resolves with an array of all interlocutors found.
     */
    async findWebIdOfInterlocutor(chatUrl) {
        const deferred = Q.defer();
        let results = [];
        const rdfjsSource = await this._getRDFjsSourceFromUrl(chatUrl);
        const self = this;

        this.engine.query(`SELECT * {
      ?invitation a <${namespaces.schema}InviteAction>;
			<${namespaces.schema}event> ?url;
			<${namespaces.schema}agent> ?agent;
			<${namespaces.schema}recipient> ?recipient.
    }`, {
                sources: [{
                    type: "rdfjsSource",
                    value: rdfjsSource
                }]
            })
            .then(function(result) {
                result.bindingsStream.on("data", (data) => {
                    data = data.toObject();
                    if (data["?recipient"]) {
                        var rFields = data["?recipient"].value.split("/");
                        results.push(self.encrypter.decrypt(rFields.splice(4, rFields.length).join("/"), false));
                    }
                });

                result.bindingsStream.on("end", function() {
                    deferred.resolve(results);
                });
            });
        return deferred.promise;
    }

    /**
     * This method is in charge of returning the RDFjs source from the url.
     * @param {string} url: URL to inspect.
     * @returns {Promise}: promise that resolves with the RDFJSource.
     * Credits to https://github.com/pheyvaer/solid-chess
     */
    _getRDFjsSourceFromUrl(url) {
        const deferred = Q.defer();

        this.fetch(url)
            .then(async (res) => {
                if (res.status === 404) {
                    deferred.reject(404);
                } else {
                    const body = await res.text();
                    const store = n3.Store();
                    const parser = n3.Parser({
                        baseIRI: res.url
                    });

                    parser.parse(body, (err, quad, prefixes) => {
                        if (err) {
                            deferred.reject();
                        } else if (quad) {
                            store.addQuad(quad);
                        } else {
                            const source = {
                                match: function(s, p, o, g) {
                                    return streamify(store.getQuads(s, p, o, g));
                                }
                            };

                            deferred.resolve(source);
                        }
                    });
                }
            });

        return deferred.promise;
    }

    /**
     * Sets current encrypter to perform operations.
     * @param {EncryptionService} encrypter: Encrypter instance.
     */
    setEncrypter(encrypter) {
        this.encrypter = encrypter;
    }
}

module.exports = SolidLoaderRepository;