/**
 * author: es6a2 group
 */
const assert = require('assert');
const Loader = require('../src/lib/Repositories/SolidLoaderRepository');
const OpenService = require('../src/lib/Services/OpenService');
const BaseService = require('../src/lib/Services/BaseService');
const namespaces = require('../src/lib/namespaces');
const auth = require('solid-auth-client');
const openService = new OpenService(auth.fetch);
const baseService = new BaseService(auth.fetch);
const loader = new Loader(auth.fetch);

describe('Services', function() {

  it('checking the picture and name are correct', async function() {
    const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

    const selfPhoto = await baseService.getPhoto(chat.userWebId);
    assert.equal(selfPhoto, null, 'The user does not have a photo : ' + chat.userWebId + ' ->' + selfPhoto);

    const name = await baseService.getFormattedName(chat.userWebId);
    assert.equal(name, 'Othmane Bakhtaoui', 'The user name is not correct : ->' + name);

  });

  it('checking the number of messages is 23', async function() {
    const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');
    //opening messages
    const chats = await openService.getChatsToOpen(chat.userWebId);
    //the user for the moment have 23 messages
    assert.equal(chats.length, 23, 'the number of messages is not correct : ' + chats.length);
  });

  it('checking the inboxUrl', async function() {
    const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

    const inboxUrls = [];
    inboxUrls[chat.userWebId] = (await baseService.getObjectFromPredicateForResource(chat.userWebId, namespaces.ldp + 'inbox')).value;
    assert.equal(inboxUrls[chat.userWebId], 'https://othbak.solid.community/inbox/', 'the inbox url is not correct : ' + inboxUrls[chat.userWebId]);

    expectedUrl = await baseService.getInboxUrl(chat.userWebId);
    assert.equal(inboxUrls[chat.userWebId], expectedUrl, 'the inbox url is not correct : ' + inboxUrls[chat.userWebId]);
  });
});
