/**
 * author: es6a2 group
 */
const assert = require('assert');
const Loader = require('../src/lib/Repositories/SolidLoaderRepository');
const OpenService = require('../src/lib/Services/OpenService');
const auth = require('solid-auth-client');

describe('Loader', function() {
  it('loading chat and interlocutor', async function() {
    const openService = new OpenService(auth.fetch);

    const loader = new Loader(auth.fetch);
    const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

    assert.equal(chat.url, 'https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'The url of the chat is not correct.' + chat.url);
    assert.equal(chat.userWebId, 'https://othbak.solid.community/profile/card#me', 'The WebId of the user is not correct : ' + chat.userWebId);

    //opening messages
    openService.getChatsToOpen(chat.userWebId);

  });
});
