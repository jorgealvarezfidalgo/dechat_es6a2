const N3 = require("n3");
const Q = require("q");
const newEngine = require("@comunica/actor-init-sparql-rdfjs").newEngine;
const namespaces = require("../namespaces");
const uniqid = require("uniqid");
const winston = require("winston");
const URI = require("uri-js");
const auth = require("solid-auth-client");
const {
    format
} = require("date-fns");
const rdfjsSourceFromUrl = require("../Repositories/rdfjssourcefactory").fromUrl;
const Uploader = require("../Repositories/SolidUploaderRepository");
const Loader = require("../Repositories/SolidLoaderRepository");
const SemanticChat = require("../semanticchat");
const Group = require("../Group");

/**
 * Parent Service which includes all packages required as well as the encrypter.
 */
class Service {
    constructor(fetch) {
        this.inboxUrls = {};
        this.fetch = fetch;
        this.alreadyCheckedResources = [];
        this.logger = winston.createLogger({
            level: "error",
            transports: [
                new winston.transports.Console(),
            ],
            format: winston.format.cli()
        });
        this.logger = winston.createLogger({
            level: "error",
            transports: [
                new winston.transports.Console(),
            ],
            format: winston.format.cli()
        });
        this.auth = auth;
        this.N3 = N3;
        this.Q = Q;
        this.format = format;
        this.newEngine = newEngine;
        this.namespaces = namespaces;
        this.uniqid = uniqid;
        this.URI = URI;
        this.rdfjsSourceFromUrl = rdfjsSourceFromUrl;
        this.SemanticChat = SemanticChat;
        this.Group = Group;
        this.uploader = new Uploader(auth.fetch);
        this.loader = new Loader(auth.fetch);
    }

    /**
     * Sets Encrypter to be used by the Service.
     * @param {EncryptionService} encrypter: Encrypter
     */
    setEncrypter(encrypter) {
        this.encrypter = encrypter;
    }

}


module.exports = Service;