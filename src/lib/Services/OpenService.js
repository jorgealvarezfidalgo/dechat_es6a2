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
const Loader = require('../Repositories/SolidLoaderRepository');

let loader = new Loader(auth.fetch);


class OpenService {
  constructor(fetch) {
    this.fetch = fetch;
	this.logger = winston.createLogger({
      level: 'error',
      transports: [
        new winston.transports.Console(),
      ],
      format: winston.format.cli()
    });
  }

  /**
   * This method returns all the chats that a user can continue, based on his WebId.
   * @param webid: the WebId of the player.
   * @returns {Promise}: a promise that resolves to an array with objects.
   * Each object contains the url of the chat (chatUrl) and the url where the data of the chat is store (storeUrl).
   */
  async getChatsToOpen(webid) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(webid, this.fetch);

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
            type: 'rdfjsSource',
            value: rdfjsSource
          }]
        })
        .then(result => {
          result.bindingsStream.on('data', async (data) => {
            const deferred = Q.defer();
            promises.push(deferred.promise);
            data = data.toObject();
            chatUrls.push({
              chatUrl: data['?chat'].value,
              storeUrl: data['?url'].value,
              interlocutor: data['?int'].value
            });
            deferred.resolve();
          });

          result.bindingsStream.on('end', function() {
            Q.all(promises).then(() => {
              //console.log(chatUrls);
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
   * This method returns the url of the file where to store the data of the chat.
   * @param fileurl: the url of the file in which to look for the storage details.
   * @param chatUrl: the url of the chat for which we want to the storage details.
   * @returns {Promise<string|null>}: a promise that resolves with the url of the file or null if none is found.
   */
  async getStorageForChat(fileurl, chatUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT ?url {
     <${chatUrl}> <${namespaces.schema}contributor> <${fileurl}>;
        <${namespaces.storage}storeIn> ?url.
  }`, {
        sources: [{
          type: 'rdfjsSource',
          value: rdfjsSource
        }]
      })
      .then(function(result) {
        result.bindingsStream.on('data', async function(data) {
          data = data.toObject();

          deferred.resolve(data['?url'].value);
        });

        result.bindingsStream.on('end', function() {
          deferred.resolve(null);
        });
      });

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
