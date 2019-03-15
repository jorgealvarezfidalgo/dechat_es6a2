"use strict";

const Core = require('../lib/core');
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


/**
 *	This button is in charge of showing the create chat option
 */
$('#new-btn').click(async () => {
    if (userWebId) {
        afterChatOption();
        $('#new-chat-options').removeClass('hidden');
        $('#data-url').prop('value', core.getDefaultDataUrl(userWebId));

        const $select = $('#contacts');

        for await (const friend of data[userWebId].friends) {
            let name = await core.getFormattedName(friend.value);

            $select.append(`<option value="${friend}">${name}</option>`);
        }
    } else {
        //alert("NOT logged in");
        $('#login-required').modal('show');
    }
});

/**
 *	This method is in charge of starting a new chat with the friend selected from the option menu
 */
$('#start-new-chat-btn').click(async () => {
	$('#data-url').prop('value', core.getDefaultDataUrl(userWebId));
    const dataUrl = $('#data-url').val();

    if (await core.writePermission(dataUrl, dataSync)) {
        $('#new-chat-options').addClass('hidden');
        interlocWebId = $('#contacts').val();
        userDataUrl = dataUrl;
        setUpNewConversation();
    } else {
        $('#write-permission-url').text(dataUrl);
        $('#write-permission').modal('show');
    }
});


/**
 *	This method is in charge of showing the user's invitations from friends to join a chat
 */
$('#join-btn').click(async () => {
    if (userWebId) {
        afterChatOption();
        $('#join-chat-options').removeClass('hidden');
        $('#join-data-url').prop('value', core.getDefaultDataUrl(userWebId));
        $('#join-looking').addClass('hidden');

        if (chatsToJoin.length > 0) {
            $('#join-loading').addClass('hidden');
            $('#join-form').removeClass('hidden');
            const $select = $('#chat-urls');
            $select.empty();

            chatsToJoin.forEach(chat => {
                let name = chat.name;

                if (!name) {
                    name = chat.chatUrl;
                }

                $select.append($(`<option value="${chat.chatUrl}">${name} ${chat.interlocutorName}</option>`));
            });
        } else {
            $('#no-join').removeClass('hidden');
        }
    } else {
        $('#login-required').modal('show');
    }
});

/**
 *	This method is in charge of initiating the conversation between the user and the friend concerned
 */
$('#join-chat-btn').click(async () => {
    if ($('#join-data-url').val() !== userWebId) {
        userDataUrl = $('#join-data-url').val();

        if (await core.writePermission(userDataUrl, dataSync)) {
            $('#join-chat-options').addClass('hidden');
            setUpForEveryChatOption();
            const chatUrl = $('#chat-urls').val();

            let i = 0;

            while (i < chatsToJoin.length && chatsToJoin[i].chatUrl !== chatUrl) {
                i++;
            }

            const chat = chatsToJoin[i];
            // remove it from the array so it's no longer shown in the UI
            chatsToJoin.splice(i, 1);


            interlocWebId = chat.friendWebId.id;
            await core.joinExistingChat(chat.invitationUrl, interlocWebId, userWebId, userDataUrl, dataSync, chat.fileUrl);
            setUpChat();
        } else {
            $('#write-permission-url').text(userDataUrl);
            $('#write-permission').modal('show');
        }
    } else {
        console.warn('We are pretty sure you do not want to remove your WebID.');
    }
});


/**
 *	This method is in charge of getting back to the main menu and showing the start, join and open chat buttons
 */
$('.btn-cancel').click(() => {
    interlocWebId = null;
    openChat = false;

    $('#chat').addClass('hidden');
    $('#new-chat-options').addClass('hidden');
    $('#join-chat-options').addClass('hidden');
    $('#open-chat-options').addClass('hidden');
    $('#chat-options').removeClass('hidden');

    $("#messagesarea").val("");
});

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
                console.log("Procesando nuevo chat");
                console.log(convoToJoin);
                chatsToJoin.push(await core.processChatToJoin(convoToJoin, fileurl));
            }
        }
    });
}

$('#open-btn').click(async () => {

    const selfPhoto = await core.getPhoto(userWebId);
    $('#selfphoto').attr("src", selfPhoto);

    afterChatOption();
    $('#chatui').removeClass('hidden');
    $('#content').addClass('hidden')
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
		contactsWithChat.splice(semanticChats.indexOf(semanticChat), 0, chat.interlocutor);

        var lastMsg = semanticChat.getLastMessage().messagetext;
        var lastHr = "";
        if (!lastMsg) {
            lastMsg = "Sin mensajes";
        } else {
            lastHr = semanticChat.getHourOfMessage(semanticChat.getMessages().length - 1);
        }

        const newmsg = 0;
        if (newmsg == 0) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter + "'><img src='" + friendPhoto + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + friendName + "</h1><p class='font-preview'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
        } else {
            var html = $("<div class='contact new-message-contact' id='" + chatCounter + "'><img src='" + friendPhoto + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + friendName + "</h1><p class='font-preview'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
        }
        $(".contact-list").prepend(html);
        document.getElementById("chatwindow" + chatCounter).addEventListener("click", loadMessagesToWindow, false);
        chatCounter += 1;
    });
    openChat = true;

});

async function loadMessagesToWindow() {
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
        const time = "21" + dateFormat.format(now, "yy-MM-dd") + "T" + dateFormat.format(now, "hh-mm-ss");
        $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + message + "</div><div class='time'>" +
            time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        await core.storeMessage(userDataUrl, username, userWebId, time, message, interlocWebId, dataSync, true);
        $('#write-chat').val("");
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
            await core.storeMessage(userDataUrl, interlocutorMessages[i].author, userWebId, interlocutorMessages[i].time, interlocutorMessages[i].messageTx, interlocWebId, dataSync, false);
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
	$(".information").append("<img src='" + currentChat.photo + "'><div><h1>Name:</h1><p>" + currentChat.interlocutorName + "</p></div></div>");
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
	chatCounter = 0;
	
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
		$(".contact-list").html("");
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
				var html = $("<div class='contact new-message-contact' id='" + chatCounter + "'><img src='" + chat.photo + "' alt='profilpicture'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview'>" + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
			}
			$(".contact-list").prepend(html);
			document.getElementById("chatwindow" + chatCounter).addEventListener("click", loadMessagesToWindow, false);
			chatCounter += 1;
    });
		showingContacts = false;
	}
});

async function openContact() {
    $(".chat").html("");
	var index = contactsWithChat.indexOf(this.getAttribute("id").replace("openchatwindow", ""));
	// console.log(contactsWithChat);
	// console.log(this.getAttribute("id").replace("openchatwindow", ""));
	// console.log(index);
	if(index != -1) {
		loadMessages(index);
	} else {
		
	}
    
}