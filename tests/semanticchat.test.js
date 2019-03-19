/**
 * author: es6a2 Group
 */
const assert = require('assert');
const SemanticChat = require('../src/lib/semanticchat');

describe('Semantic Chat Testing', function() {
  it('loading a created chat', async function() {
    const chat = new SemanticChat({
      url: 'http://example.org/myChat',
      userWebId: 'http://example.org/#me',
      interlocutorWebId: 'http://example.org/#other',
    });

    assert.equal(chat.getUrl(), 'http://example.org/myChat', 'The url of the chat is not correct.');
    assert.equal(chat.userWebId, 'http://example.org/#me', 'The user web id is not correct.');
    assert.equal(chat.interlocutorWebId, 'http://example.org/#other', 'The friend web id is not correct.');
  });
});
