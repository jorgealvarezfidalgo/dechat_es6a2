"use strict";

const Core = require('../lib/core');
const SemanticChat = require('../lib/semanticchat');
const auth = require('solid-auth-client');
const {
    default: data
} = require('@solid/query-ldflex');
const namespaces = require('../lib/namespaces');
const DataSync = require('../lib/datasync');
const Loader = require('../lib/loader');


let core = new Core(auth.fetch);
let userWebId;
let interlocWebId;
let refreshIntervalId;
let dataSync = new DataSync(auth.fetch);
let userDataUrl;
let chatsToJoin = [];
let openChats = [];
let interlocutorMessages = [];
let semanticChats = [];
let contactsWithChat = [];
let openChat = false;
let chatCounter = 0;
let currentChat;
let showingContacts = false;

/**
 *	This method is in charge of showing the popup to login or register
 */
$('.login-btn').click(() => {
    auth.popupLogin({
        popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html'
    });
});

/**
 *	This method is in charge of the user's logout
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
});

/**
 * This method updates the UI after a chat option has been selected by the user.
 */
function afterChatOption() {
    $('#chat-options').addClass('hidden');
}

/**
 *	This method is in charge of the user's login
 */
auth.trackSession(async session => {
    const loggedIn = !!session;
    //alert(`logged in: ${loggedIn}`);

    if (loggedIn) {
        $('#user-menu').removeClass('hidden');
        $('#nav-login-btn').addClass('hidden');
        $('#login-required').modal('hide');

        userWebId = session.webId;
        const name = await core.getFormattedName(userWebId);

        if (name) {
            $('#user-name').removeClass('hidden');
            $('#user-name').text(name);
        }
        openChats = [];
        const chats = await core.getChatsToOpen(userWebId);
        chats.forEach(async chat => {
            openChats.push(chat);
        });

        checkForNotifications();
		
		await startChat();
		await sleep(5000);
		await loadChats();
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

    const updates = await core.checkUserInboxForUpdates(await core.getInboxUrl(userWebId)); //HECHO

    updates.forEach(async (fileurl) => {

        //console.log(fileurl);

        // check for new
        let newMessageFound = false;
        let message = await core.getNewMessage(fileurl, userWebId, dataSync);
        if (message) {
            console.log("Guardando mensajes");

            newMessageFound = true;
            if (openChat) {
                await showAndStoreMessages();
            } else {
                interlocutorMessages.push(message);
            }
        }

        if (!newMessageFound) {
            const convoToJoin = await core.getJoinRequest(fileurl, userWebId);
			
            if (convoToJoin) {
				$("#showinvs").show();
                console.log("Procesando nuevo chat");
                chatsToJoin.push(await core.processChatToJoin(convoToJoin, fileurl));
            }
        }
    });
	if(chatsToJoin.length == 0) {
		$("#showinvs").hide();
	}
}

async function startChat() {

    const selfPhoto = await core.getPhoto(userWebId);
    $('#selfphoto').attr("src", selfPhoto);

    afterChatOption();
    openChats.forEach(async chat => {
        interlocWebId = chat.interlocutor;
        const friendName = await core.getFormattedName(chat.interlocutor);
        var friendPhoto = await core.getPhoto(chat.interlocutor);
        if (!friendPhoto) {
            friendPhoto = "https://www.biografiasyvidas.com/biografia/b/fotos/bernardo_de_claraval.jpg";
        }

        userDataUrl = chat.storeUrl;

        const loader = new Loader(auth.fetch);
        var semanticChat = await loader.loadFromUrl(chat.chatUrl.split("#")[0], userWebId, userDataUrl);
        semanticChat.interlocutorWebId = chat.interlocutor;
		semanticChat.interlocutorName = friendName;
		semanticChat.photo = friendPhoto;
				
		semanticChats.push(semanticChat);
    });
    openChat = true;
}

async function loadChats() {
	console.log(semanticChats);
	semanticChats.sort(function (a,b) {  var x = a.getLastMessage().time; var y = b.getLastMessage().time;
		console.log(x<y);
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));});
	//await sleep(20000);

	semanticChats.forEach(async chat => {
		contactsWithChat.splice(semanticChats.indexOf(chat), 0, chat.interlocutorWebId);
		
		var lastMsg = chat.getLastMessage().messagetext;
        var lastHr = "";
        if (!lastMsg) {
            lastMsg = "Sin mensajes";
        } else {
            lastHr = chat.getHourOfMessage(chat.getMessages().length - 1);
        }
		
		const newmsg = 0;
        if (newmsg == 0) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter +"'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
        } else {
            var html = $("<div class='contact new-message-contact' id='" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter +"'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
        }
        $(".contact-list").prepend(html);
        document.getElementById("chatwindow" + chatCounter).addEventListener("click", loadMessagesToWindow, false);
        chatCounter += 1;
	});
	
	console.log(semanticChats);
	console.log(contactsWithChat);
}

async function loadMessagesToWindow() {
	$(".information >").remove();
	$(".information").hide();
    var id = this.getAttribute("id").replace("chatwindow", "");
	await loadMessages(Number(id));
    
}

async function loadMessages(id) {
	$(".chat").html("");
    currentChat = semanticChats[id];
	// console.log(semanticChats);
	// console.log(currentChat);
    var friendPhoto = await core.getPhoto(currentChat.interlocutorWebId);
    if (!friendPhoto) {
        friendPhoto = "https://www.biografiasyvidas.com/biografia/b/fotos/bernardo_de_claraval.jpg";
    }
    $('#interlocutorphoto').attr("src", friendPhoto);
    interlocWebId = currentChat.interlocutorWebId;
    $("#interlocutorw-name").html("");
    $("#interlocutorw-name").append(currentChat.interlocutorName);

    currentChat.getMessages().forEach(async (message) => {

        showMessage(message);

    });
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
        $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + message + "</div><div class='time'>" +
            time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        await core.storeMessage(userDataUrl, username, userWebId, time, message, interlocWebId, dataSync, true);
        $('#write-chat').val("");
		var index = contactsWithChat.indexOf(interlocWebId);
		$('#chatwindow'+index).remove();
		
		semanticChats[index].loadMessage({
			messagetext: message,
			url: null,
			author: username,
			time: time
		});
		
		if(!showingContacts) {
		var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter +"'>" + message + "</p></div></div><div class='contact-time'><p>" + semanticChats[index].getHourOfMessage(semanticChats[index].getMessages().length - 1); + "</p></div></div>";
       
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
            await core.storeMessage(userDataUrl, interlocutorMessages[i].author, userWebId, interlocutorMessages[i].time, interlocutorMessages[i].messagetext, interlocWebId, dataSync, false);
			var index = contactsWithChat.indexOf(interlocWebId);
			semanticChats[index].loadMessage({
				messagetext: interlocutorMessages[i].messagetext,
				url: null,
				author: interlocutorMessages[i].author,
				time: interlocutorMessages[i].time
			});
            dataSync.deleteFileForUser(interlocutorMessages[i].inboxUrl);
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
	if (message.author === $('#user-name').text()) {
            $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + message.messagetext + "</div><div class='time'>" +
                message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        } else {
            $(".chat").append("<div class='chat-bubble you'><div class='your-mouth'></div><div class='content'>" + message.messagetext + "</div><div class='time'>" +
                message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        }
}

$('#show-contact-information').click(async () => {
	$(".chat-head i").hide();
			$(".information").css("display", "flex");
			$("#close-contact-information").show();
	var note = await core.getNote(interlocWebId);
	if(!note) {
		note = "Nothing to see here";
	}
	$(".information").append("<img src='" + currentChat.photo + "'><div><h1>Name:</h1><p>" + currentChat.interlocutorName + "</p><h1>Status:</h1><p>" + note + "</p></div>");
});

$('#close-contact-information').click(async () => {
	$(".chat-head i").show();
			$("#close-contact-information").hide();
			$(".information >").remove();
			$(".information").hide();
});

$('#show-contacts').click(async () => {
	$(".contact-list").html("");
	$('#data-url').prop('value', core.getDefaultDataUrl(userWebId));
	
	
	if(!showingContacts) {

    for await (const friend of data[userWebId].friends) {
        let name = await core.getFormattedName(friend.value);
		 var friendPhoto = await core.getPhoto(friend.value);
        if (!friendPhoto) {
            friendPhoto = "https://www.biografiasyvidas.com/biografia/b/fotos/bernardo_de_claraval.jpg";
        }

        var html = "<div style='cursor: pointer;' class='contact' id='openchatwindow" + friend.value + "'><img src='" + friendPhoto + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + name + "</h1><p class='font-preview'>" + "</p></div></div><div class='contact-time'><p>" + "</p></div></div>";

        $(".contact-list").prepend(html);
		document.getElementById("openchatwindow" + friend.value).addEventListener("click", openContact, false);
		
	}
	showingContacts = true;
	} else {
		await showChats();
		showingContacts = false;
	}
});

async function showChats() {
	$(".contact-list").html("");
		chatCounter = 0;
		semanticChats.forEach(async chat => {

			var lastMsg = chat.getLastMessage().messagetext;
			var lastHr = "";
			if (!lastMsg) {
				lastMsg = "Sin mensajes";
			} else {
				lastHr = chat.getHourOfMessage(chat.getMessages().length - 1);
			}

			const newmsg = 0;
			if (newmsg == 0) {
				var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
			} else {
				var html = $("<div style='cursor: pointer;' class='contact new-message-contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
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
	if(index != -1) {
		loadMessages(index);
	} else {
		const dataUrl = core.getDefaultDataUrl(userWebId);

		if (await core.writePermission(dataUrl, dataSync)) {
			interlocWebId = intWebId;
			userDataUrl = dataUrl;
			var semanticChat = await core.setUpNewChat(userDataUrl, userWebId, interlocWebId, dataSync);
			const friendName = await core.getFormattedName(interlocWebId);
			var friendPhoto = await core.getPhoto(interlocWebId);
			if (!friendPhoto) {
				friendPhoto = "https://www.biografiasyvidas.com/biografia/b/fotos/bernardo_de_claraval.jpg";
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
        var friendPhoto = await core.getPhoto(chat.friendWebId.id);
        if (!friendPhoto) {
            friendPhoto = "https://www.biografiasyvidas.com/biografia/b/fotos/bernardo_de_claraval.jpg";
        }
		console.log(friendPhoto);
		var html = $("<div style='cursor: pointer;' class='contact new-message-contact' id='join" + chat.chatUrl + "'><img src='" + friendPhoto + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview'>Wants to chat with you</p></div></div><div class='contact-time'><p>" + "</p><div class='new-message' id='nm" + "'><p>" + "1" + "</p></div></div></div>");
        $(".contact-list").prepend(html);
        document.getElementById("join" + chat.chatUrl).addEventListener("click", joinChat, false);   
           });
}

async function joinChat() {
	var url = this.getAttribute("id").replace("join", "");
	let i = 0;

	while (i < chatsToJoin.length && chatsToJoin[i].chatUrl !== url) {
		i++;
	}

	const chat = chatsToJoin[i];
	chatsToJoin.splice(i, 1);


	interlocWebId = chat.friendWebId.id;
	userDataUrl = await core.getDefaultDataUrl(userWebId);
	await core.joinExistingChat(chat.invitationUrl, interlocWebId, userWebId, userDataUrl, dataSync, chat.fileUrl);
	
	var friendPhoto = await core.getPhoto(chat.friendWebId.id);
        if (!friendPhoto) {
            friendPhoto = "https://www.biografiasyvidas.com/biografia/b/fotos/bernardo_de_claraval.jpg";
        }
		
	var semanticChat = new SemanticChat({
            url: url,
            messageBaseUrl: userDataUrl,
            userWebId,
            interlocutorWebId: interlocWebId,
			interlocutorName: chat.interlocutorName,
			photo: friendPhoto
        });
	console.log(semanticChat);
		
	semanticChats.push(semanticChat);
	var index = semanticChats.indexOf(semanticChat);
	contactsWithChat.splice(index, 0, interlocWebId);
	console.log(semanticChats);
	console.log(contactsWithChat);
	
	await showChats();
	await loadMessages(index);
	await showAndStoreMessages();
}