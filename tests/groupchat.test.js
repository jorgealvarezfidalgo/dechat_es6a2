/**
 * author: es6a2 Group
 */
const assert = require('assert');
const auth = require('solid-auth-client');
const Group = require('../src/lib/Group');
const BaseService = require('../src/lib/Services/BaseService');
const baseService = new BaseService(auth.fetch);


describe('Semantic Group Chat Testing', function() {

  it('creating a new semantic chat', async function() {
    const group = new Group({
      url: 'http://example.org/myChat',
      userWebId: 'https://morningstar.solid.community/profile/card#me',
      interlocutorWebId: 'https://helbrecht.solid.community/profile/card#me',
      chatBaseUrl:'http://example.org/myBaseChatUrl',
      messages:null,
      numberOfMessages:0,
      interlocutorName: await baseService.getFormattedName('https://helbrecht.solid.community/profile/card#me'),
      photo:'myphoto',
      lastHr:'08:10',
      members:null,
      numberOfMembers :0

    });

    assert.equal(group.getUrl(), 'http://example.org/myChat', 'The url of the chat is not correct.');
    assert.equal(group.userWebId, 'https://morningstar.solid.community/profile/card#me', 'The user web id is not correct.');
    assert.equal(group.getInterlocutorWebId(), 'https://helbrecht.solid.community/profile/card#me', 'The friend web id is not correct.');
    assert.equal(group.chatBaseUrl, 'http://example.org/myBaseChatUrl', 'The user web id is not correct.');
    assert.equal(group.getMessages().length, 0, 'there are not any messages yet.');
    assert.equal(group.getNumberOfMsgs(), 0, 'the number of messages should be 0.');
    assert.equal(group.getLastMessage().messagetext, null, 'we do not have any message for the moment ->' + group.getLastMessage().messagetext);
    assert.equal(group.getHourOfMessage(group.getLastMessage()), null, 'the time should not appear as we do not have any messages');

    group.loadMessage('how are you');

    assert.equal(group.getMessages()[0], 'how are you', 'The first message is not correct :' + group.getMessages()[0]);
    assert.equal(group.getMessages()[1], null, 'We do not have a second message');
    assert.equal(group.getMessages()[2], null, 'We do not have a second message');
    assert.equal(group.getNumberOfMsgs(), 1, 'the number of messages should be 1');
    assert.equal(group.getLastMessage(), group.getMessages()[0] , 'The last message ->'+group.getLastMessage()+ 'should be the only message as we have only one ->' +group.getMessages()[0]);
    assert.equal(group.getNumberOfMembers(), 0 , 'we should not have any members');
    assert.equal(group.getMembers(), null , 'we should not have any members');

    //setting two members
    const members = ['https://morningstar.solid.community/profile/card#me', 'https://helbrecht.solid.community/profile/card#me'];
    group.setMembers(members);

    assert.equal(group.getMembers()[0], 'https://morningstar.solid.community/profile/card#me', 'the first member is not correct');
    assert.equal(group.getMembers()[1], 'https://helbrecht.solid.community/profile/card#me', 'the second member is not correct');
    assert.equal(group.getMembers()[2], null, 'we should not have a third member for the moment');

    //adding a new member to be saved in the first position
    const member = 'https://othbak.solid.community/profile/card#me';
    group.saveMember(member);

    assert.equal(group.getMembers()[0], 'https://othbak.solid.community/profile/card#me', 'the saved member is not correct');

  });

});
