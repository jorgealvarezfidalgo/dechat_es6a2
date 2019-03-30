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
const BaseService = require("./BaseService");
const CreateService = require("./CreateService");
const Uploader = require("../Repositories/SolidUploaderRepository");
const Loader = require("../Repositories/SolidLoaderRepository");
const SemanticChat = require("../semanticchat");
const Group = require("../Group");

let uploader = new Uploader(auth.fetch);
let loader = new Loader(auth.fetch);

let baseService = new BaseService(auth.fetch);
let createService = new CreateService(auth.fetch);

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
    }
}
module.exports = Service;
