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

  it('base Service tests', async function () {
      const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

      const selfPhoto = await baseService.getPhoto(chat.userWebId);
      assert.equal(selfPhoto, null, 'The user does not have a photo : ' + chat.userWebId + ' ->' + selfPhoto);

      const name = await baseService.getFormattedName(chat.userWebId);
      assert.equal(name, 'Othmane Bakhtaoui', 'The user name is not correct : ->' + name);

      const note = await baseService.getNote(chat.userWebId);
      assert.equal(note, null, 'we do not have a note yet.');

      const userDataUrl = await baseService.getDefaultDataUrl(chat.userWebId);
      chat.url = await baseService.generateUniqueUrlForResource(userDataUrl);
      //everytime should be different
      assert.notEqual(chat.url, "https://othbak.solid.community/private/dechat_201903220911.ttl#yeb74cmsjtki2wzo", 'chat unique url is not correct');

      //we do not have an invitation
      const invite = baseService.getInvitation(chat.fileurl);
      assert.equal(invite.sender, null, 'the invitation url is not correct: ->' + invite.sender);
  });

  it('more base Service tests', async function () {
      const note2 = await baseService.getNote("https://oth3.solid.community/profile/card#me");
      assert.equal(note2, "testing", 'we do have a note ->' + note2);

      const defaultPic = await baseService.getDefaultFriendPhoto();
      assert.equal(defaultPic, "main/resources/static/img/friend_default.jpg", 'Default picture is incorrect.');
  });

  it('base Service tests -> updates and invitations', async function () {
        //this user does have an invitation
        const anotherInvitation = baseService.getInvitation("https://yarrick.solid.community/public/");
        assert.notEqual(anotherInvitation, null, 'the invitation url is not correct: ->' + anotherInvitation);

        //check user inbox for updates
        var updates = await baseService.checkUserInboxForUpdates("https://yarrick.solid.community/public/");
        assert.notEqual(updates, null, 'the user does have updates' + updates);

        const inv = baseService.getInvitation("https://morningstar.solid.community/public/dechat_201903160752.ttl#jtbuliv7");
        assert.notEqual(inv, null, 'the user does have an invitation ->' + inv);
  });

    it('checking the picture and name are correct using loader', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

        const selfPhoto = await baseService.getPhoto(chat.userWebId);
        assert.equal(selfPhoto, null, 'The user does not have a photo : ' + chat.userWebId + ' ->' + selfPhoto);

        const name = await baseService.getFormattedName(chat.userWebId);
        assert.equal(name, 'Othmane Bakhtaoui', 'The user name is not correct : ->' + name);

        const note = await baseService.getNote(chat.userWebId);
        assert.equal(note, null, 'we do not have a note yet.');
    });

    it('checking the picture and name are correct using loader with a user with no name', async function () {
        const chat = await loader.loadChatFromUrl('https://decker.solid.community/public/dechat_201903110956.ttl#jt4tuya4', 'https://decker.solid.community/profile/card#me', 'https://decker.solid.community/public/dechat_201903110956.ttl');

        const selfPhoto = await baseService.getPhoto(chat.userWebId);
        assert.equal(selfPhoto, null, 'The user does not have a photo : ' + chat.userWebId + ' ->' + selfPhoto);

        const name = await baseService.getFormattedName(chat.userWebId);
        assert.equal(name, 'Decker', 'The user name is not correct : ->' + name);
    });


    it('Simple chat tests using openService.js', async function () {
        const userDataUrl = await baseService.getDefaultDataUrl("https://othbak.solid.community/profile/card#me");
        const chat = await openService.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl', "https://morningstar.solid.community/profile/card#me");

        const selfPhoto = await baseService.getPhoto(chat.userWebId);
        assert.equal(selfPhoto, null, 'The user does not have a photo : ' + chat.userWebId + ' ->' + selfPhoto);

        const name = await baseService.getFormattedName(chat.userWebId);
        assert.equal(name, 'Othmane Bakhtaoui', 'The user name is not correct : ->' + name);

        const note = await baseService.getNote(chat.userWebId);
        assert.equal(note, null, 'we do not have a note yet.');
    });

    it('Checking the number of stored chats is none in chatstorage.ttl simulator', async function () {

        const chats = await openService.getChatsToOpen("https://yarrick.solid.community/public/dechat_201903120205.ttl");
        //the user for the moment have no messages
        assert.equal(chats.length, 0, 'the number of chats stored is not correct : ' + chats.length);
    });

    it('checking the inboxUrl', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

        const inboxUrls = [];
        inboxUrls[chat.userWebId] = (await baseService.getObjectFromPredicateForResource(chat.userWebId, namespaces.ldp + 'inbox')).value;
        assert.equal(inboxUrls[chat.userWebId], 'https://othbak.solid.community/inbox/', 'the inbox url is not correct : ' + inboxUrls[chat.userWebId]);

        expectedUrl = await baseService.getInboxUrl(chat.userWebId);
        assert.equal(inboxUrls[chat.userWebId], expectedUrl, 'the inbox url is not correct : ' + inboxUrls[chat.userWebId]);

        //checking user updates
        try {
            const updates = await baseService.checkUserInboxForUpdates(inboxUrls[chat.userWebId]);
            assert.equal(updates, null, 'there are no updates in this profile');
        } catch (err) {

        }

    });

    it('checking that there are 4 messages in my pod', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');
        assert.equal(chat.getMessages().length, 9, 'the number of messages is not correct : ' + chat.getMessages().length);
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

    it('Message Service tests', async function () {
        const chat = await loader.loadChatFromUrl('https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl', 'https://othbak.solid.community/profile/card#me', 'https://othbak.solid.community/public/unittest_201903201125.ttl');

        let message = await messageService.getNewMessage(chat.chatUrl, chat.userWebId);
        //no messages found
        assert.equal(message, null, 'there should not be any new messages: ->' + message);

        messageService.storeMessage("https://morningstar.solid.community/private/dechat_201903190808.ttl", "Luci", "https://morningstar.solid.community/profile/card#me", '2119-03-22T22-08-59', "hey", "https://decker.solid.community/profile/card#me", true, null);

    });


	it('Message Service: get new message from simulated inbox', async function () {
        let message = await messageService.getNewMessage("https://yarrick.solid.community/public/dechat_201903140619.ttl", null);

        assert.equal(message.inboxUrl, "https://yarrick.solid.community/public/dechat_201903140619.ttl", 'Url should be : -> https://yarrick.solid.community/public/dechat_201903140619.ttl');
    		assert.equal(message.messagetext, "The unenlightened masses", "Message text not properly loaded");
    		assert.equal(message.messageUrl, "https://sundowner.solid.community/private/dechat_201903281144.ttl#jtt86m2l", "Wrong message url");
    		assert.equal(message.author, "https://yarrick.solid.community/public/Group/Grupo C/Sundowner", "Author of message not properly loading");
    		assert.equal(message.time, "2119-03-28T23-46-30", "Time of message not properly loading");
    });


    it('Group chat tests using loader', async function () {
        //group chat
        const groupChat = await loader.loadGroupFromUrl('https://morningstar.solid.community/public/dechat_201903221046.ttl', 'https://morningstar.solid.community/profile/card#me', 'https://morningstar.solid.community/public/dechat_201903221046.ttl');

        const selfPhoto = await baseService.getPhoto(groupChat.userWebId);
        assert.equal(selfPhoto, null, 'The user does not have a photo : ' + groupChat.userWebId + ' ->' + selfPhoto);

        const name = await baseService.getFormattedName(groupChat.userWebId);
        assert.equal(name, 'Luci', 'The user name is not correct : ->' + name);

        //the group for the moment has 1 messages
        assert.equal(groupChat.getNumberOfMsgs(), 1, 'the number of messages is not correct : ' + groupChat.getNumberOfMsgs());
    });

    it('Join service test', async function () {
        const userDataUrl = await baseService.getDefaultDataUrl("https://morningstar.solid.community/profile/card#me");
        //cannot be tested as it changes the time
        assert.notEqual(userDataUrl, "https://morningstar.solid.community/private/dechat_201903231229.ttl", 'the user data Url is not correct : ' + userDataUrl);

        await joinService.joinExistingChat(userDataUrl, "https://othbak.solid.community/profile/card#me", "https://morningstar.solid.community/profile/card#me", "https://morningstar.solid.community/private/dechat_201903221145.ttl#jtknkfrd", "Othmane Bakhtaoui", undefined);
        //if no error then it's all good
        //the other cases cannot be tested as the file urls are private and cannot be accessed.
    });

    it('Join Services Test: processChatToJoin and getJoinRequest', async function () {
      const invite = baseService.getInvitation("https://othbak.solid.community/public/unittest_201903201125.ttl#jth2a2sl");
      assert.notEqual(invite, null, 'the invitation url is not correct: ->' + invite);

      var join = joinService.getJoinRequest("https://othbak.solid.community/public/dechat_201903110835.ttl", "https://othbak.solid.community/profile/card#me");
      assert.notEqual(join, null, 'the user does have a join request: ->' + join);

      var processChatToJoin = joinService.processChatToJoin("https://othbak.solid.community/public/dechat_201903110835.ttl", "https://othbak.solid.community/public/dechat_201903110835.ttl", "https://othbak.solid.community/profile/card#me", "https://othbak.solid.community/profile/card#me" ,"https://othbak.solid.community/public/dechat_201903110835.ttl");
      assert.notEqual(processChatToJoin, null, 'the user does have a join request: ->' + processChatToJoin);

    });

});
