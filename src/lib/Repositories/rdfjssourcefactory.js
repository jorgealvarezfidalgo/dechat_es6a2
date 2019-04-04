const N3 = require("n3");
const Q = require("q");

/**
 * This method returns an RDFJSSource of an url
 * @param {string} url: url of the source
 * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
 */
function fromUrl(url, fetch) {
    const deferred = Q.defer();
	console.log("fromUrl");
    fetch(url)
        .then(async res => {
            if (res.status === 404) {
                deferred.reject(404);
            } else {
                const body = await res.text();
                const store = N3.Store();
                const parser = N3.Parser({
                    baseIRI: res.url
                });
                parser.parse(body, (err, quad, prefixes) => {
                    if (err) {
						console.log(err);
                        deferred.reject();
                    } else if (quad) {
                        store.addQuad(quad);
                    } else {
                        const source = {
                            match: function(s, p, o, g) {
                                return require("streamify-array")(store.getQuads(s, p, o, g));
                            }
                        };
						console.log(source);
                        deferred.resolve(source);
                    }
                });
            }
        }).catch(reason => {
            console.warn(`No RDFJSSource was created for ${url}. File already deleted?`);
            deferred.resolve(null);
        });

    return deferred.promise;
}

module.exports = {
    fromUrl
};
