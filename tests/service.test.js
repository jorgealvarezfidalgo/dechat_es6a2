/**
 * author: es6a2 group
 */
const assert = require('assert');
const Loader = require('../src/lib/Repositories/SolidLoaderRepository');
const OpenService = require('../src/lib/Services/OpenService');
const auth = require('solid-auth-client');

describe('Loader', function() {
  it('loading chat and interlocutor', async function() {
    openService.getChatsToOpen(userWebId);
    const loader = new Loader(auth.fetch);
    let openService = new OpenService(auth.fetch);
    const chat = await loader.loadFromUrl('https://morningstar.solid.community/public/dechat_201903160752.ttl#jtbuliv7', 'https://morningstar.solid.community/profile/card#me', 'https://morningstar.solid.community/public/dechat_201903160752.ttl');
    assert.equal(chat.getUrl(), 'https://morningstar.solid.community/public/dechat_201903160752.ttl#jtbuliv7', 'The url of the chat is not correct.' + chat.getUrl());
    assert.equal(chat.userWebId, 'https://morningstar.solid.community/profile/card#me', 'The WebId of the user is not correct : ' + chat.userWebId);
  });
});
