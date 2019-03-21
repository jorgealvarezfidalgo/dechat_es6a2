"use strict";

const BaseService = require('../lib/Services/BaseService');
const JoinService = require('../lib/Services/JoinService');
const MessageService = require('../lib/Services/MessageService');
const OpenService = require('../lib/Services/OpenService');
const CreateService = require('../lib/Services/CreateService');
const SemanticChat = require('../lib/semanticchat');
const auth = require('solid-auth-client');
const {
    default: data
} = require('@solid/query-ldflex');
const namespaces = require('../lib/namespaces');


let baseService = new BaseService(auth.fetch);
let joinService = new JoinService(auth.fetch);
let messageService = new MessageService(auth.fetch);
let openService = new OpenService(auth.fetch);
let createService = new CreateService(auth.fetch);
let userWebId;
let interlocWebId;
let refreshIntervalId;
let userDataUrl;
let chatsToJoin = [];
let openChats = [];
let interlocutorMessages = [];
let semanticChats = [];
let contactsWithChat = [];
let contactsForGroup = [];
let openChat = false;
let chatCounter = 0;
let currentChat;
let showingContacts = false;

$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
});

/**
 *    This method is in charge of showing the popup to login or register
 */
$('.login-btn').click(() => {
    auth.popupLogin({
        popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html'
    });

    $(".loading").removeClass('hidden');
});

/**
 *    This method is in charge of the user's logout
 */
$('#logout-btn').click(() => {
    auth.logout();
    $(".contact-list").html("");
    $(".chat").html("");
    $("#showinvs").hide();
    chatsToJoin = [];
    openChats = [];
    interlocutorMessages = [];
    semanticChats = [];
    contactsWithChat = [];
    $(".wrap").addClass('hidden');
    $(".mustlogin").removeClass('hidden');
});

/**
 * This method updates the UI after a chat option has been selected by the user.
 */
function afterChatOption() {
    $('#chat-options').addClass('hidden');
}

/**
 *    This method is in charge of the user's login
 */
auth.trackSession(async session => {
    const loggedIn = !!session;
    //alert(`logged in: ${loggedIn}`);

    if (loggedIn) {
        $('#user-menu').removeClass('hidden');
        $('#nav-login-btn').addClass('hidden');
        $('#login-required').modal('hide');
        $(".mustlogin").addClass('hidden');
        $(".loading").removeClass('hidden');

        userWebId = session.webId;
        const name = await baseService.getFormattedName(userWebId);

        if (name) {
            $('#user-name').removeClass('hidden');
            $('#user-name').text(name);
        }
        openChats = [];
        const chats = await openService.getChatsToOpen(userWebId);
        chats.forEach(async chat => {
            openChats.push(chat);
        });

        await startChat();
        await sleep(8000);
        await loadChats();
        checkForNotifications();
        $(".wrap").removeClass('hidden');
        $(".loading").addClass('hidden');
        // refresh every 3sec
        refreshIntervalId = setInterval(checkForNotifications, 3000);
    } else {
        //alert("you're not logged in");
        $('#nav-login-btn').removeClass('hidden');
        $('#user-menu').addClass('hidden');
        $('#new-chat-options').addClass('hidden');
        $('#join-chat-options').addClass('hidden');
        $('#open-chat-options').addClass('hidden');
        userWebId = null;
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * This method checks if a new message has been made by the friend.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotifications() {
    //console.log('Checking for new notifications');

    const updates = await baseService.checkUserInboxForUpdates(await baseService.getInboxUrl(userWebId)); //HECHO
    //console.log(updates);

    updates.forEach(async (fileurl) => {

        //console.log(fileurl);

        // check for new
        let newMessageFound = false;
        let message = await messageService.getNewMessage(fileurl, userWebId);
        if (message) {
            console.log("Guardando mensajes");

            newMessageFound = true;
            var nameThroughUrl = message.author.split("/").pop();
            console.log("nombre de authorUrl is:" + nameThroughUrl);
            console.log("original interlocutorName is:" + $('#interlocutorw-name').text());
            console.log(message);
            var authorUrl = message.messageUrl.split("priv")[0] + "profile/card#me";

            console.log(authorUrl);
            console.log(contactsWithChat);
            if (nameThroughUrl === $('#interlocutorw-name').text()) {
                interlocutorMessages.push(message);
                await showAndStoreMessages();
            } else if (contactsWithChat.indexOf(authorUrl) != -1) {
                console.log("NEW MESSAGE - SITUATION B");
                var index = contactsWithChat.indexOf(authorUrl);
                $('#chatwindow' + index).remove();
                var parsedmessage = message.messagetext.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
                var html = $("<div class='contact new-message-contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName + "</h1><p class='font-preview' id='lastMsg" + index + "'>" + parsedmessage + "</p></div></div><div class='contact-time'><p>" + semanticChats[index].getHourOfMessage(semanticChats[index].numberOfMessages - 1) + "</p><div class='new-message' id='nm" + index + "'><p>" + "1" + "</p></div></div></div>");
                $(".contact-list").prepend(html);
                document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
                interlocutorMessages.push(message);
            } else if (openChat) {
                interlocutorMessages.push(message);
            }
        }

        if (!newMessageFound) {
            const convoToJoin = await joinService.getJoinRequest(fileurl);

            if (convoToJoin) {
                $("#showinvs").show();
                console.log("Procesando nuevo chat");
                chatsToJoin.push(await joinService.processChatToJoin(convoToJoin, fileurl, userWebId, userDataUrl));
				alert("New invitations. They shall be dismissed if not accepted on this session.");
            }
        }
    });
    if (chatsToJoin.length == 0) {
        $("#showinvs").hide();
    }
    // console.log(semanticChats);
    // console.log(contactsWithChat);
}

async function startChat() {

    const selfPhoto = await baseService.getPhoto(userWebId);

    if (!selfPhoto) {
        $('#selfphoto').attr("src", "https://www.azquotes.com/public/pictures/authors/c3/10/c310c1b5df6fa4f117bf320814e9f39e/5434efd94977a_benedict_of_nursia.jpg");
    }
    $('#selfphoto').attr("src", selfPhoto);

    afterChatOption();
    console.log(openChats);
    openChats.forEach(async chat => {
        interlocWebId = chat.interlocutor;
        const friendName = await baseService.getFormattedName(chat.interlocutor);
        var friendPhoto;
        if (chat.interlocutor.includes("Group")) {
            friendPhoto = "main/resources/static/img/group.jpg";
        } else {
            friendPhoto = await baseService.getPhoto(chat.interlocutor);
        }
        if (!friendPhoto) {
            friendPhoto = baseService.getDefaultFriendPhoto();
        }

        userDataUrl = chat.storeUrl;

        var semanticChat = await openService.loadChatFromUrl(chat.chatUrl.split("#")[0], userWebId, userDataUrl, chat.interlocutor);
        semanticChat.interlocutorWebId = chat.interlocutor;
        semanticChat.interlocutorName = friendName;
        semanticChat.photo = friendPhoto;

        semanticChats.push(semanticChat);
    });
    openChat = true;
}

async function loadChats() {
    console.log(semanticChats);
    semanticChats.sort(function(a, b) {
        var x = a.getLastMessage().time;
        var y = b.getLastMessage().time;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    //await sleep(20000);

    semanticChats.forEach(async chat => {
        contactsWithChat.splice(semanticChats.indexOf(chat), 0, chat.interlocutorWebId);

        var lastMsg = chat.getLastMessage().messagetext;
        var lastHr = "";
        if (!lastMsg) {
            lastMsg = "Sin mensajes";
        } else {
            lastMsg = lastMsg.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
            console.log(chat.getNumberOfMsgs() - 1);
            lastHr = chat.getHourOfMessage(chat.getNumberOfMsgs() - 1);
        }

        const newmsg = 0;
        if (newmsg == 0) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter + "'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
        } else {
            var html = $("<div class='contact new-message-contact' id='" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter + "'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
        }
        $(".contact-list").prepend(html);
        document.getElementById("chatwindow" + chatCounter).addEventListener("click", loadMessagesToWindow, false);
        chatCounter += 1;
    });

    //console.log(semanticChats);
    //console.log(contactsWithChat);
}

async function loadMessagesToWindow() {

    $(".information >").remove();
    $(".information").hide();
    var id = this.getAttribute("id").replace("chatwindow", "");
    await loadMessages(Number(id));
    await showAndStoreMessages();
    console.log(userDataUrl);
}

async function loadMessages(id) {
    $(".chat").html("");
    $("#nm" + id).remove();
    currentChat = semanticChats[id];
    userDataUrl = currentChat.url;
    // console.log(semanticChats);
    var friendPhoto = currentChat.photo;
    if (!friendPhoto) {
        friendPhoto = baseService.getDefaultFriendPhoto();
    }
    $('#interlocutorphoto').attr("src", friendPhoto);
    interlocWebId = currentChat.interlocutorWebId;
    $("#interlocutorw-name").html("");
    $("#interlocutorw-name").append(currentChat.interlocutorName.replace(/U\+0020/g, " "));

    currentChat.getMessages().forEach(async (message) => {

        showMessage(message);

    });
    toScrollDown();
}

document.onkeydown = checkKey;

async function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '13' && $("#write-chat").val() != "") {
        const username = $('#user-name').text();
        const message = $("#write-chat").val();
        var dateFormat = require('date-fns');
        var now = new Date();
        const time = "21" + dateFormat.format(now, "yy-MM-dd") + "T" + dateFormat.format(now, "HH-mm-ss");
		console.log(currentChat);
        if (currentChat.interlocutorWebId.includes("Group"))
            await messageService.storeMessage(userDataUrl, username, userWebId, time, message, interlocWebId, true, currentChat.members);
        else
            await messageService.storeMessage(userDataUrl, username, userWebId, time, message, interlocWebId, true, null);
        $('#write-chat').val("");
        var index = contactsWithChat.indexOf(currentChat.interlocutorWebId);
        $('#chatwindow' + index).remove();

        semanticChats[index].loadMessage({
            messagetext: message,
            url: null,
            author: username,
            time: time
        });

        const parsedmessage = message.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
        $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + parsedmessage + "</div><div class='time'>" +
            time.substring(11, 16).replace("\-", "\:") + "</div></div>");

        toScrollDown();

        if (!showingContacts) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName + "</h1><p class='font-preview' id='lastMsg" + index + "'>" + parsedmessage + "</p></div></div><div class='contact-time'><p>" + semanticChats[index].getHourOfMessage(semanticChats[index].getNumberOfMsgs() - 1); +
            "</p></div></div>";

            $(".contact-list").prepend(html);
            document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
        }
    }

}

async function showAndStoreMessages() {
    var i = 0;
    //console.log("interloc WEBID is :" + interlocWebId); //Decker.solid.community/....

    while (i < interlocutorMessages.length) {
        //console.log("interloc author is: " + interlocutorMessages[i].author); //...../Deker //Yarrick is better
        var nameThroughUrl = interlocutorMessages[i].author.split("/").pop();
        console.log("nombre de authorUrl is:" + nameThroughUrl);
        console.log("original interlocutorName is:" + $('#interlocutorw-name').text());
        if (nameThroughUrl === $('#interlocutorw-name').text()) {
            showMessage(interlocutorMessages[i]);
            await messageService.storeMessage(userDataUrl, interlocutorMessages[i].author.split("/").pop(), userWebId, interlocutorMessages[i].time, interlocutorMessages[i].messagetext, interlocWebId, false);
            var index = contactsWithChat.indexOf(interlocWebId);
            semanticChats[index].loadMessage({
                messagetext: interlocutorMessages[i].messagetext,
                url: null,
                author: interlocutorMessages[i].author.split("/").pop(),
                time: interlocutorMessages[i].time
            });
            baseService.deleteFileForUser(interlocutorMessages[i].inboxUrl);
            $('#chatwindow' + index).remove();
            const parsedmessage = interlocutorMessages[i].messagetext.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName + "</h1><p class='font-preview' id='lastMsg" + index + "'>" + parsedmessage + "</p></div></div><div class='contact-time'><p>" + semanticChats[index].getHourOfMessage(semanticChats[index].numberOfMessages - 1) + "</p></div></div>";
            $(".contact-list").prepend(html);
            document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
            interlocutorMessages[i] = "D";
            console.log("Matching names. All Correct");
        }
        i++;
    }
    i = interlocutorMessages.length;
    while (i--) {
        if (interlocutorMessages[i] == "D") {
            interlocutorMessages.splice(i, 1);
        }
    }
}

function showMessage(message) {
    const parsedmessage = message.messagetext.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
    if (message.author === $('#user-name').text()) {
        $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + parsedmessage + "</div><div class='time'>" +
            message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
    } else {
        if (currentChat.interlocutorWebId.includes("Group")) {
            $(".chat").append("<div class='chat-bubble you'><div class='your-mouth'></div><h4>" + message.author + "</h4><div class='content'>" + parsedmessage + "</div><div class='time'>" +
                message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        } else {
            $(".chat").append("<div class='chat-bubble you'><div class='your-mouth'></div><div class='content'>" + parsedmessage + "</div><div class='time'>" +
                message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        }
    }
    $(".fa fa-bars fa-lg").removeClass('hidden');;
    toScrollDown();
}

$('#show-contact-information').click(async () => {
    $(".chat-head i").hide();
    $(".information").css("display", "flex");
    $("#close-contact-information").show();
    console.log(currentChat);
    var note;
    if (!interlocWebId.includes("Group"))
        note = await baseService.getNote(interlocWebId);
    if (!note) {
        note = "Nothing to see here";
    }
    $(".information").append("<img src='" + currentChat.photo + "'><div><h1>Name:</h1><p>" + currentChat.interlocutorName + "</p><h1>Status:</h1><p>" + note + "</p></div>");
    if (interlocWebId.includes("Group")) {
        $(".information").append("<div id='listGroups'><h1>Participants:</h1></div>");
        for (var i = 0; i < currentChat.members.length; i++) {
            var memberPhoto = await baseService.getPhoto(currentChat.members[i].id);
            if (!memberPhoto) {
                memberPhoto = baseService.getDefaultFriendPhoto();
            }
            var memberName = await baseService.getFormattedName(currentChat.members[i].id);
            var html = $("<div class='listGroups'><img src='" + memberPhoto + "'><p>" + memberName + "</p></div>");
            $("#listGroups").append(html);
        }
    }
});

$('#close-contact-information').click(async () => {
    $(".chat-head i").show();
    $("#close-contact-information").hide();
    $(".information >").remove();
    $(".information").hide();
});

$('#show-contacts').click(async () => {
    await displayContacts(openContact);
});

async function displayContacts(func) {
    $(".contact-list").html("");
    $('#data-url').prop('value', baseService.getDefaultDataUrl(userWebId));


    if (!showingContacts) {

        for await (const friend of data[userWebId].friends) {
            let name = await baseService.getFormattedName(friend.value);
            var friendPhoto = await baseService.getPhoto(friend.value);
            if (!friendPhoto) {
                friendPhoto = baseService.getDefaultFriendPhoto();
            }

            var html = "<div style='cursor: pointer;' class='contact' id='openchatwindow" + friend.value + "'><img src='" + friendPhoto + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + name + "</h1><p class='font-preview' id='ctmsg" + friend.value.split("/")[2].split(".")[0] + "'></p></div></div><div class='contact-time'><p>" + "</p></div></div>";

            $(".contact-list").prepend(html);
            document.getElementById("openchatwindow" + friend.value).addEventListener("click", func, false);

        }
        showingContacts = true;
    } else {
        await showChats();
        showingContacts = false;
    }
}

async function showChats() {
    $(".contact-list").html("");
    chatCounter = 0;
    semanticChats.forEach(async chat => {

        var lastMsg = chat.getLastMessage().messagetext;
        var lastHr = "";
        if (!lastMsg) {
            lastMsg = "Sin mensajes";
        } else {
            lastMsg = lastMsg.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
            lastHr = chat.getHourOfMessage(chat.getMessages().length - 1);
        }

        const newmsg = 0;
        if (newmsg == 0) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter + "'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
        } else {
            var html = $("<div style='cursor: pointer;' class='contact new-message-contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter + "'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
        }
        $(".contact-list").prepend(html);
        document.getElementById("chatwindow" + chatCounter).addEventListener("click", loadMessagesToWindow, false);
        chatCounter += 1;
    });
}

async function openContact() {
    $(".chat").html("");
    var intWebId = this.getAttribute("id").replace("openchatwindow", "");
    var index = contactsWithChat.indexOf(intWebId);
    // console.log(contactsWithChat);
    // console.log(this.getAttribute("id").replace("openchatwindow", ""));
    // console.log(index);
    if (index != -1) {
        loadMessages(index);
    } else {
        const dataUrl = baseService.getDefaultDataUrl(userWebId);

        if (await baseService.writePermission(dataUrl)) {
            interlocWebId = intWebId;
            userDataUrl = dataUrl;
            var semanticChat = await createService.setUpNewChat(userDataUrl, userWebId, interlocWebId);
            const friendName = await baseService.getFormattedName(interlocWebId);
            var friendPhoto = await baseService.getPhoto(interlocWebId);
            if (!friendPhoto) {
                friendPhoto = baseService.getDefaultFriendPhoto();
            }

            semanticChat.interlocutorName = friendName;
            semanticChat.photo = friendPhoto;
            semanticChats.push(semanticChat);
            index = semanticChats.indexOf(semanticChat);
            contactsWithChat.splice(index, 0, intWebId);
            console.log(semanticChat);
            console.log(contactsWithChat);
            loadMessages(index);
        } else {
            $('#write-permission-url').text(dataUrl);
            $('#write-permission').modal('show');
        }
    }

}

$('#showinvs').click(async () => {
    await showInvitations();
});

async function showInvitations() {
    $(".contact-list").html("");
    chatsToJoin.forEach(async chat => {
        var friendPhoto = chat.photo;
	
		if (!friendPhoto) {
			friendPhoto = await baseService.getPhoto(chat.interlocutorWebId);
			if(!friendPhoto)
				friendPhoto = baseService.getDefaultFriendPhoto();
		}
	
        var html = $("<div style='cursor: pointer;' class='contact new-message-contact' id='join" + chat.url + "'><img src='" + friendPhoto + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview'>Wants to chat with you</p></div></div><div class='contact-time'><p>" + "</p><div class='new-message' id='nm" + "'><p>" + "1" + "</p></div></div></div>");
        $(".contact-list").prepend(html);
        document.getElementById("join" + chat.url).addEventListener("click", joinChat, false);
    });
}

async function joinChat() {
    var url = this.getAttribute("id").replace("join", "");
    let i = 0;

    while (i < chatsToJoin.length && chatsToJoin[i].url !== url) {
        i++;
    }

    const chat = chatsToJoin[i];
    chatsToJoin.splice(i, 1);
	console.log("C");
    userDataUrl = await baseService.getDefaultDataUrl(userWebId);
	console.log(userDataUrl);
	chat.url =  await baseService.generateUniqueUrlForResource(userDataUrl);
	console.log(chat.interlocutorWebId);
    await joinService.joinExistingChat(userDataUrl, chat.interlocutorWebId, userWebId, chat.url, chat.interlocutorName, chat.members);

    var friendPhoto = chat.photo;
	
    if (!friendPhoto) {
		friendPhoto = await baseService.getPhoto(chat.interlocutorWebId);
		if(!friendPhoto)
			friendPhoto = baseService.getDefaultFriendPhoto();
    }
	chat.photo = friendPhoto;
	
	console.log("Chat to join should have loaded");
	console.log(chat);

    semanticChats.push(chat);
    var index = semanticChats.indexOf(chat);
	if(chat.members)
		contactsWithChat.splice(index, 0, chat.interlocutorName);
	else
		contactsWithChat.splice(index, 0, chat.interlocutorWebId);
    console.log(semanticChats);
    console.log(contactsWithChat);

    await showChats();
    await loadMessages(index);
    await showAndStoreMessages();
}

function toScrollDown() {
    var elem = document.getElementById('chatdiv');
    elem.scrollTop = elem.scrollHeight;
}

$('#create-group').click(async () => {
    if (!showingContacts) {
        $(".fa-search").addClass("hidden");
        $(".input-search").attr("placeholder", " Group name");
        $(".creategroup").removeClass("hidden");
    } else {
        $(".creategroup").addClass("hidden");
        $(".fa-search").removeClass("hidden");
        $(".input-search").attr("placeholder", "Find a chat");
    }
    await displayContacts(markContactForGroup);
});

async function markContactForGroup() {
    var intWebId = this.getAttribute("id").replace("openchatwindow", "");
    var index = contactsForGroup.indexOf(intWebId);
    if (index == -1) {
        console.log('ctmsg' + intWebId.split("/")[2]);
        $('#ctmsg' + intWebId.split("/")[2].split(".")[0]).html("Selected");
        contactsForGroup.push(intWebId);
    } else {
        $('#ctmsg' + intWebId.split("/")[2].split(".")[0]).html("");
        contactsForGroup.splice(index, 1);
    }
}

$('#creategroup').click(async () => {

    if ($('.input-search').val() != "") {
        if (contactsForGroup.length >= 2) {
            const dataUrl = baseService.getDefaultDataUrl(userWebId);
            userDataUrl = dataUrl;
            console.log(contactsForGroup);
            console.log($('.input-search').val());
            console.log(userDataUrl);
            console.log(userWebId);
            var intWebId = $('.input-search').val();
			console.log(intWebId);
            var group = await createService.setUpNewGroup(userDataUrl, userWebId, contactsForGroup, intWebId);
            console.log(group);
            semanticChats.push(group);
            var index = semanticChats.indexOf(group);
            contactsWithChat.splice(index, 0, "Group/" + intWebId);
            console.log(semanticChats);
            console.log(contactsWithChat);
            loadMessages(index);
            await showChats();
            showingContacts = false;
            $(".creategroup").addClass("hidden");
            $(".fa-search").removeClass("hidden");
            $(".input-search").attr("placeholder", "Find a chat");
        } else {
            alert("You need at least 2 contacts to start a group.");
        }
    } else {
        alert("Group has no name.");
    }

});

process.on('uncaughtException', function(err){
    console.error(err.stack);
    process.exit();
});