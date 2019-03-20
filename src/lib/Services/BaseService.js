const N3 = require('n3');
const Q = require('q');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('../namespaces');
const uniqid = require('uniqid');
const winston = require('winston');
const URI = require('uri-js');
const auth = require('solid-auth-client');
const {
  format
} = require('date-fns');
const rdfjsSourceFromUrl = require('../Repositories/rdfjssourcefactory').fromUrl;
const Uploader = require('../Repositories/SolidUploaderRepository');

let uploader = new Uploader(auth.fetch);

class BaseService {

  constructor(fetch) {
    this.inboxUrls = {};
    this.fetch = fetch;
    this.alreadyCheckedResources = [];
    this.logger = winston.createLogger({
      level: 'error',
      transports: [
        new winston.transports.Console(),
      ],
      format: winston.format.cli()
    });this.logger = winston.createLogger({
      level: 'error',
      transports: [
        new winston.transports.Console(),
      ],
      format: winston.format.cli()
    });
  }

  /**
   * This method returns a formatted name for a WebId.
   * @param webid: the WebId for which a formatted name needs to be created.
   * @returns {Promise<string|null>}: a promise that resolvew with the formatted name (string) or
   * null if no name details were found.
   */
  async getFormattedName(webid) {
	if(webid.includes("Group"))
		return webid.split("Group/").pop().replace(/U\+0020/g, " ");
    let formattedName = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'name');

    if (!formattedName) {
      formattedName = null;
      const firstname = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'givenName');
      const lastname = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'lastName');

      if (firstname) {
        formattedName = firstname;
      }

      if (lastname) {
        if (formattedName) {
          formattedName += ' ';
        } else {
          formattedName = '';
        }

        formattedName += lastname;
      }

      if (!formattedName) {
        formattedName = webid;
      }
    } else {
      formattedName = formattedName.value;
    }

    return formattedName;
  }

  async getPhoto(webid) {
    let photoUrl = await this.getObjectFromPredicateForResource(webid, 'http://www.w3.org/2006/vcard/ns#hasPhoto');
    if (photoUrl)
      return photoUrl.value;
    else
      return null;
  }

  async getNote(webid) {
    let noteUrl = await this.getObjectFromPredicateForResource(webid, 'http://www.w3.org/2006/vcard/ns#note');
    if (noteUrl)
      return noteUrl.value;
    else
      return null;
  }

  /**
   * This method returns the object of resource via a predicate.
   * @param url: the url of the resource.
   * @param predicate: the predicate for which to look.
   * @returns {Promise}: a promise that resolves with the object or null if none is found.
   */

  async getObjectFromPredicateForResource(url, predicate) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(url, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();

      engine.query(`SELECT ?o {
    <${url}> <${predicate}> ?o.
  }`, {
          sources: [{
            type: 'rdfjsSource',
            value: rdfjsSource
          }]
        })
        .then(function(result) {
          result.bindingsStream.on('data', function(data) {
            data = data.toObject();

            deferred.resolve(data['?o']);
          });

          result.bindingsStream.on('end', function() {
            deferred.resolve(null);
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  getDefaultDataUrl(webId) {
    const parsedWebId = URI.parse(webId);
    const today = format(new Date(), 'yyyyMMddhhmm');

    return `${parsedWebId.scheme}://${parsedWebId.host}/private/dechat_${today}.ttl`;
  }

  async writePermission(url) {
    const response = await uploader.executeSPARQLUpdateForUser(url, 'INSERT DATA {}');
    return response.status === 200;
  }



  async generateUniqueUrlForResource(baseurl) {
    let url = baseurl + '#' + uniqid();

    try {
      let d = this.getObjectFromPredicateForResource(url, namespaces.rdf + 'type');

      // We assume that if this url doesn't have a type, the url is unused.
      // Ok, this is not the most fail-safe thing.
      // TODO: check if there are any triples at all.
      while (d) {
        url = baseurl + '#' + uniqid();
        d = await this.getObjectFromPredicateForResource(url, namespaces.rdf + 'type');
      }
    } catch (e) {
      // this means that response of data[url] returns a 404
      // TODO might be called when you have no access, should check
    } finally {
      return url;
    }
  }

  async getInboxUrl(webId) {
    if (!this.inboxUrls[webId]) {
      this.inboxUrls[webId] = (await this.getObjectFromPredicateForResource(webId, namespaces.ldp + 'inbox')).value;
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
    const deferred = Q.defer();
    const newResources = [];
    const rdfjsSource = await rdfjsSourceFromUrl(inboxUrl, this.fetch);
    const self = this;
    const engine = newEngine();
    //console.log(this.alreadyCheckedResources);

    engine.query(`SELECT ?resource {
      ?resource a <http://www.w3.org/ns/ldp#Resource>.
    }`, {
        sources: [{
          type: 'rdfjsSource',
          value: rdfjsSource
        }]
      })
      .then(function(result) {
        result.bindingsStream.on('data', data => {
          data = data.toObject();

          const resource = data['?resource'].value;
          //console.log(resource);
          if (self.alreadyCheckedResources.indexOf(resource) === -1) {
            newResources.push(resource);
            self.alreadyCheckedResources.push(resource);
          }
        });

        result.bindingsStream.on('end', function() {
          deferred.resolve(newResources);
        });
      });

    return deferred.promise;
  }

  async getInterlocutor(fileurl, userWebId) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);
    //console.log(fileurl);

    if (rdfjsSource) {
      const engine = newEngine();
      let invitationFound = false;
      const self = this;

      engine.query(`SELECT * {
		?invitation a <${namespaces.schema}InviteAction>;
	<${namespaces.schema}agent> ?sender;
	<${namespaces.schema}event> ?chaturl;
	<${namespaces.schema}recipient> ?interlocutor.
  }`, {
          sources: [{
            type: 'rdfjsSource',
            value: rdfjsSource
          }]
        })
        .then(function(result) {
          console.log(result);
          result.bindingsStream.on('data', async function(result) {

            invitationFound = true;
            result = result.toObject();

            deferred.resolve(
              result['?interlocutor'].value
            );
          });

          result.bindingsStream.on('end', function() {
            if (!invitationFound) {
              console.log("NO");
              deferred.resolve(null);
            }
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  async getAllObjectsFromPredicateForResource(url, predicate) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(url, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();
      const objects = [];

      engine.query(`SELECT ?o {
    <${url}> <${predicate}> ?o.
  }`, {
          sources: [{
            type: 'rdfjsSource',
            value: rdfjsSource
          }]
        })
        .then(function(result) {
          result.bindingsStream.on('data', function(data) {
            data = data.toObject();

            objects.push(data['?o']);
          });

          result.bindingsStream.on('end', function() {
            deferred.resolve(objects);
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  async getAllResourcesInInbox(inboxUrl) {
    const deferred = Q.defer();
    const resources = [];
    const rdfjsSource = await rdfjsSourceFromUrl(inboxUrl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT ?resource {
        ?resource a <http://www.w3.org/ns/ldp#Resource>.
      }`, {
        sources: [{
          type: 'rdfjsSource',
          value: rdfjsSource
        }]
      })
      .then(function(result) {
        result.bindingsStream.on('data', data => {
          data = data.toObject();

          const resource = data['?resource'].value;
          resources.push(resource);
        });

        result.bindingsStream.on('end', function() {
          deferred.resolve(resources);
        });
      });

    return deferred.promise;
  }

  async fileContainsChatInfo(fileUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileUrl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT * {
      OPTIONAL { ?s a <${namespaces.schema}InviteAction>.}
      OPTIONAL { ?s a <${namespaces.schema}Message> ?o; <${namespaces.schema}text> ?t.}
    }`, {
        sources: [{
          type: 'rdfjsSource',
          value: rdfjsSource
        }]
      })
      .then(function(result) {
        result.bindingsStream.on('data', data => {
          console.log(result);
          deferred.resolve(true);
        });

        result.bindingsStream.on('end', function() {
          deferred.resolve(false);
        });
      });

    return deferred.promise;
  }

  deleteFileForUser(url) {
	  uploader.deleteFileForUser(url);
  }

}

module.exports = BaseService;
