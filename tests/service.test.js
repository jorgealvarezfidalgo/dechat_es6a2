/**
 * author: es6a2 group
 */
const assert = require('assert');
const Loader = require('../src/lib/Repositories/SolidLoaderRepository');
const OpenService = require('../src/lib/Services/OpenService');
const BaseService = require('../src/lib/Services/BaseService');
const CreateService = require('../src/lib/Services/CreateService');
const MessageService = require('../src/lib/Services/MessageService');
const JoinService = require('../src/lib/Services/JoinService');

const namespaces = require('../src/lib/namespaces');
const auth = require('solid-auth-client');
const openService = new OpenService(auth.fetch);
const baseService = new BaseService(auth.fetch);
const joinService = new JoinService(auth.fetch);
const messageService = new MessageService(auth.fetch);
const createService = new CreateService(auth.fetch);

const loader = new Loader(auth.fetch);

describe('Services', function () {

    it('checking the picture and name are correct', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

        const selfPhoto = await baseService.getPhoto(chat.userWebId);
        assert.equal(selfPhoto, null, 'The user does not have a photo : ' + chat.userWebId + ' ->' + selfPhoto);

        const name = await baseService.getFormattedName(chat.userWebId);
        assert.equal(name, 'Othmane Bakhtaoui', 'The user name is not correct : ->' + name);

        const note =   await baseService.getNote(chat.userWebId);
        assert.equal(note, null, 'we do not have a note yet.');


    });

    it('checking the number of messages is 23', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');
        //opening messages
        const chats = await openService.getChatsToOpen(chat.userWebId);
        //the user for the moment have 23 messages
        assert.equal(chats.length, 23, 'the number of messages is not correct : ' + chats.length);
    });

    it('checking the inboxUrl', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

        const inboxUrls = [];
        inboxUrls[chat.userWebId] = (await baseService.getObjectFromPredicateForResource(chat.userWebId, namespaces.ldp + 'inbox')).value;
        assert.equal(inboxUrls[chat.userWebId], 'https://othbak.solid.community/inbox/', 'the inbox url is not correct : ' + inboxUrls[chat.userWebId]);

        expectedUrl = await baseService.getInboxUrl(chat.userWebId);
        assert.equal(inboxUrls[chat.userWebId], expectedUrl, 'the inbox url is not correct : ' + inboxUrls[chat.userWebId]);

    });

    it('checking that there are 4 messages in my pod', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');
        assert.equal(chat.getMessages().length, 4, 'the number of messages is not correct : ' + chat.getMessages().length);
        assert.equal(chat.getMessages()[0].messagetext, 'unit', 'the text message is not correct : ' + chat.getMessages()[0].messagetext);
        assert.equal(chat.getMessages()[1].messagetext, 'test', 'the text message is not correct : ' + chat.getMessages()[1].messagetext);
    });

    it('checking writing permissions', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');
        const dataUrl = baseService.getDefaultDataUrl(chat.userWebId);
        assert.equal(await baseService.writePermission(dataUrl), false, 'we do not have writing permission for the moment ');
    });

    it('creating individual semantic chat', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');
        const dataUrl = baseService.getDefaultDataUrl(chat.userWebId);
        var semanticChat = await createService.setUpNewChat(dataUrl, chat.userWebId, 'https://morningstar.solid.community/profile/card#me');
        const friendName = await baseService.getFormattedName('https://morningstar.solid.community/profile/card#me');

        //simulating a new chat
        assert.equal(friendName, 'Luci', 'The user name is not correct : ->' + friendName);
        assert.equal(semanticChat.userWebId, 'https://othbak.solid.community/profile/card#me', 'The user web id is not correct : ->' + semanticChat.userWebId);
        assert.equal(semanticChat.getMessages().length, 0, 'we do not have messages yet : ' + semanticChat.getMessages().length);
        assert.equal(semanticChat.interlocutorWebId, 'https://morningstar.solid.community/profile/card#me', 'Thefriend web id is not correct : ->' + semanticChat.userWebId);

        //getting interlocutor
        let interlocutor = baseService.getInterlocutor(semanticChat.fileurl, 'https://othbak.solid.community/profile/card#me')
        //the same user because he sent the message
        assert.equal(interlocutor.length, null , 'The interlocutor is not correct : ->' + interlocutor.length);


    });

    it('creating group semantic chat', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

        const dataUrl = baseService.getDefaultDataUrl(chat.userWebId);
        const interlocutorIds = ['https://morningstar.solid.community/profile/card#me', 'https://helbrecht.solid.community/profile/card#me'];

        var group = await createService.setUpNewGroup(dataUrl, chat.userWebId, interlocutorIds, '');

        //simulating a new chat
        assert.equal(group.userWebId, 'https://othbak.solid.community/profile/card#me', 'The user web id is not correct : ->' + group.userWebId);
        assert.equal(group.getMessages().length, 0, 'we do not have messages yet in this group : ' + group.getMessages().length);
        assert.equal(group.members[0], 'https://morningstar.solid.community/profile/card#me', 'The first friend web id is not correct : ->' + group.members[0]);
        assert.equal(group.members[1], 'https://helbrecht.solid.community/profile/card#me', 'The second friend web id is not correct : ->' + group.members[1]);
        assert.equal(group.members[2], null, 'we only have two friends and the user in this group.');

    });

    it('joining a new chat', async function () {
        const chat = await loader.loadChatFromUrl('https://morningstar.solid.community/public/unittest_201903201127.ttl#jth2a2sl', 'https://morningstar.solid.community/profile/card#me', 'https://morningstar.solid.community/public/unittest_201903201127.ttl');
        let newMessageFound = false;
        let convoToJoin = false;
        let message = await messageService.getNewMessage(chat.fileurl, chat.userWebId);
        if (message) {
            newMessageFound = true;
        }
        convoToJoin = await joinService.getJoinRequest(chat.fileurl, chat.userWebId, joinService);
        const dataUrl = baseService.getDefaultDataUrl(chat.userWebId);
        //this should do nothing
        //await joinService.joinExistingChat(chat.invitationUrl, chat.interlocWebId, chat.userWebId, dataUrl, chat.fileUrl);

        assert.equal(newMessageFound, false, 'the user does not have pending invitations.');
        assert.equal(convoToJoin, null, 'the user does not have convos to join. ->' + convoToJoin);
    });

    it('joining a new chat', async function () {
        const chat = await loader.loadChatFromUrl('https://morningstar.solid.community/public/unittest_201903201127.ttl#jth2a2sl', 'https://morningstar.solid.community/profile/card#me', 'https://morningstar.solid.community/public/unittest_201903201127.ttl');
        let newMessageFound = false;
        let convoToJoin = false;
        let message = await messageService.getNewMessage(chat.fileurl, chat.userWebId);
        if (message) {
            newMessageFound = true;
        }

        convoToJoin = await joinService.getJoinRequest(chat.fileurl, chat.userWebId, joinService);
        const dataUrl = baseService.getDefaultDataUrl(chat.userWebId);
        //this should do nothing
        //await joinService.joinExistingChat(chat.invitationUrl, chat.interlocWebId, chat.userWebId, dataUrl, chat.fileUrl);

        assert.equal(newMessageFound, false, 'the user does not have pending invitations.');
        assert.equal(convoToJoin, null, 'the user does not have convos to join. ->' + convoToJoin);
        assert.equal(messageService.getChatOfMessage(message).messageText,null, 'the user does not have pending invitations');
        const username = await baseService.getFormattedName('https://othbak.solid.community/profile/card#me');

        //simulating a store message test and should return error
        messageService.storeMessage(chat.fileurl, username, 'https://othbak.solid.community/profile/card#me', '11:20', 'hello', 'https://morningstar.solid.community/profile/card#me', 'hello', null);
    });
});
