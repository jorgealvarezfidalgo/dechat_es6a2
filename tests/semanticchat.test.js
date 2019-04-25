/**
 * author: es6a2 Group
 */
const assert = require("assert");
const auth = require("solid-auth-client");
const SemanticChat = require("../src/lib/semanticchat");
const BaseService = require("../src/lib/Services/BaseService");
const baseService = new BaseService(auth.fetch);


describe("Semantic Chat Testing", function() {
	
  it("Testing a generic semantic chat", async function() {
    const chat = new SemanticChat({
      url: "http://example.org/myChat",
      userWebId: "http://example.org/#me",
      interlocutorWebId: "http://example.org/#other",
    });

    assert.equal(chat.getUrl(), "http://example.org/myChat", "The url of the chat is not correct.");
    assert.equal(chat.userWebId, "http://example.org/#me", "The user web id is not correct.");
    assert.equal(chat.interlocutorWebId, "http://example.org/#other", "The friend web id is not correct.");
  });

  it("Creating a new semantic chat", async function() {
    const chat = new SemanticChat({
      url: "http://example.org/myChat",
      userWebId: "https://morningstar.solid.community/profile/card#me",
      interlocutorWebId: "https://helbrecht.solid.community/profile/card#me",
      chatBaseUrl:"http://example.org/myBaseChatUrl",
      messages:null,
      numberOfMessages:0,
      interlocutorName: await baseService.getFormattedName("https://helbrecht.solid.community/profile/card#me"),
      photo:"myphoto",
      lastHr:"08:10"
    });

    assert.equal(chat.getUrl(), "http://example.org/myChat", "The url of the chat is not correct.");
    assert.equal(chat.userWebId, "https://morningstar.solid.community/profile/card#me", "The user web id is not correct.");
    assert.equal(chat.getInterlocutorWebId(), "https://helbrecht.solid.community/profile/card#me", "The friend web id is not correct.");
    assert.equal(chat.chatBaseUrl, "http://example.org/myBaseChatUrl", "The user web id is not correct.");
    assert.equal(chat.getMessages().length, 0, "there are not any messages yet.");
    assert.equal(chat.getNumberOfMsgs(), 0, "the number of messages should be 0.");
    assert.equal(chat.getLastMessage().messagetext, null, "we do not have any message for the moment ->" + chat.getLastMessage().messagetext);
    assert.equal(chat.getHourOfMessage(chat.getLastMessage()), null, "the time should not appear as we do not have any messages");


    chat.loadMessage("how are you");

    assert.equal(chat.getMessages()[0], "how are you", "The first message is not correct :" + chat.getMessages()[0]);
    assert.equal(chat.getMessages()[1], null, "We do not have a second message");
    assert.equal(chat.getMessages()[2], null, "We do not have a second message");
    assert.equal(chat.getNumberOfMsgs(), 1, "the number of messages should be 1");
    assert.equal(chat.getLastMessage(), chat.getMessages()[0] , "The last message ->"+chat.getLastMessage()+ "should be the only message as we have only one ->" +chat.getMessages()[0]);
  });

});
