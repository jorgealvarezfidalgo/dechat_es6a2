const URI = require("uri-js");

/**
 * A class with helper methods for reading and writing of Solid PODs.
 * Heavily inspired by https://github.com/pheyvaer/solid-chess
 */
class SolidUploaderRepository {

    /**
     * The constructor initiates a DataSync instance.
     */
    constructor(fetch) {
        this.fetch = fetch;
    }

    /**
     * This method deletes a file.
     * @param url: the url of the file that needs to be deleted.
     * @returns {Promise}: the promise from auth.fetch().
     */
    deleteFileForUser(url) {
        return this.fetch(url, {
            method: "DELETE"
        });
    }

    /**
     * This method executes an SPARQL update on a file.
     * @param url: the url of the file that needs to be updated.
     * @param query: the SPARQL update query that needs to be executed.
     * @returns {Promise}: the promise from auth.fetch().
     */
    executeSPARQLUpdateForUser(url, query) {
        return this.fetch(url, {
            method: "PATCH",
            body: query,
            headers: {
                "Content-Type": "application/sparql-update"
            }
        });
    }

    /**
     * This method sends a notification to an inbox.
     * @param url: the url of the inbox.
     * @param data: the RDF data representing the notification.
     * @returns {Promise}: the promise from auth.fetch().
     */
    sendToInterlocutorInbox(url, data) {
        return this.fetch(url, {
            method: "POST",
            body: data
        });
    }

}

module.exports = SolidUploaderRepository;
