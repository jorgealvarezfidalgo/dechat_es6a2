"use strict";

const BaseService = require("../lib/Services/BaseService");
const JoinService = require("../lib/Services/JoinService");
const MessageService = require("../lib/Services/MessageService");
const OpenService = require("../lib/Services/OpenService");
const CreateService = require("../lib/Services/CreateService");
const SemanticChat = require("../lib/semanticchat");
const auth = require("solid-auth-client");
const {
    default: data
} = require("@solid/query-ldflex");
const namespaces = require("../lib/namespaces");
const Encrypter = require("../lib/Services/EncryptionService");

let encrypter = new Encrypter();
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
let contactsToOpen = false;

$(document).ready(function () {
    $("[data-toggle='tooltip']").tooltip();
	randomPhrase();
});

/**
 *    This method is in charge of showing the popup to login or register
 */
$(".login-btn").click(() => {
    auth.popupLogin({
        popupUri: "https://solid.github.io/solid-auth-client/dist/popup.html"
    });
});

/**
 *    This method is in charge of the user"s logout
 */
$("#logout-btn").click(() => {
    auth.logout();
    location.reload(true);
    $(".contact-list").html("");
    $(".chat").html("");
    $("#showinvs").hide();
    chatsToJoin = [];
    openChats = [];
    interlocutorMessages = [];
    semanticChats = [];
    contactsWithChat = [];
    contactsForGroup = [];
    $(".wrap").addClass("hidden");
    $(".mustlogin").removeClass("hidden");
    $("#interlocutorw-name").text("");
});

/**
 * This method updates the UI after a chat option has been selected by the user.
 */
function afterChatOption() {
    $("#chat-options").addClass("hidden");
}

async function startChat() {

    var selfPhoto = await baseService.getPhoto(userWebId);

    if (!selfPhoto) {
        selfPhoto = "https://www.azquotes.com/public/pictures/authors/c3/10/c310c1b5df6fa4f117bf320814e9f39e/5434efd94977a_benedict_of_nursia.jpg";
    }
    $("#selfphoto").attr("src", selfPhoto);

    afterChatOption();
    //console.log(openChats);
    openChats.forEach(async (chat) => {
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
    //console.log(semanticChats);
    semanticChats.sort(function (a, b) {
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
            if (lastMsg.includes("data:image")) {
                lastMsg = "<img alt = 'uploaded'  src = '" + lastMsg + "'" + "/>";
            } else if (lastMsg.includes("data:video")) {
                lastMsg = "<video width='20' height='20'> <source src= '" + lastMsg + "'> Your browser does not support HTML5 video. </video>";
            } else if (lastMsg.includes("data:text")) {
                lastMsg = "<a class='disable' href='" + lastMsg + "'>"
                    + "Text File</a>";
            } else {
                lastMsg = lastMsg.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
            }
            //console.log(chat.getNumberOfMsgs() - 1);
            lastHr = chat.getHourOfMessage(chat.getNumberOfMsgs() - 1);
        }

        const newmsg = 0;
        if (newmsg == 0) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter
                + "'><img src='" + chat.photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName
                + "</h1><p class=font-preview' id='lastMsg" + chatCounter + "'>"
                + lastMsg
                + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
        } else {
            var html = $("<div class='contact new-message-contact' id='" + chatCounter + "'><img src='" + chat.photo
                + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter + "'>"
                + lastMsg + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm" + lastHr + "'><p>" + "1" + "</p></div></div></div>");
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
    await showAndStoreMessages();
    //console.log(userDataUrl);
}

$("#enterpwd").click(async() => {

    const pwd1 = encrypter.hash($("#pwd1").val());
	const pwd2 = encrypter.hash($("#pwd2").val());
	$("#pwd1").val("");
	$("#pwd2").val("");
	if(pwd1!== "" && pwd1===pwd2) {
		encrypter.setPassword(pwd1);
		$(".unblockage").addClass("hidden");
		$(".loading").removeClass("hidden");
		baseService.setEncrypter(encrypter);
		joinService.setEncrypter(encrypter);
		messageService.setEncrypter(encrypter);
		openService.setEncrypter(encrypter);
		createService.setEncrypter(encrypter);
		openChats = [];
		await baseService.checkPrivate(userWebId);
		try {
			const chats = await openService.getChatsToOpen(userWebId);
			if(chats) {
				chats.forEach(async (chat) => {
					openChats.push(chat);
				});
			}
		} catch(e) {
			console.log(e);
		}

        await startChat();
		await sleep(4000);
        await loadChats();
        checkForNotifications();
        $(".wrap").removeClass("hidden");
        $(".loading").addClass("hidden");
		$("#interlocutorphoto").attr("src", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Cross-Jerusalem-Potent-Heraldry.svg/800px-Cross-Jerusalem-Potent-Heraldry.svg.png");
        // refresh every 3sec
        refreshIntervalId = setInterval(checkForNotifications, 3000);

	} else {
		$("#pwderror").text("Las contraseñas no coinciden.");
	}
});

/**
 *    This method is in charge of the user"s login
 */
auth.trackSession(async (session) => {
    const loggedIn = !!session;
    //alert(`logged in: ${loggedIn}`);

    if (loggedIn) {
        $("#user-menu").removeClass("hidden");
        $("#nav-login-btn").addClass("hidden");
        $("#login-required").modal("hide");
        $(".mustlogin").addClass("hidden");

        userWebId = session.webId;
        const name = await baseService.getFormattedName(userWebId);

        if (name) {
            $("#user-name").removeClass("hidden");
            $("#user-name").text(name);
        }

		$(".unblockage").removeClass("hidden");

    } else {
        //alert("you"re not logged in");
        $("#nav-login-btn").removeClass("hidden");
        $("#user-menu").addClass("hidden");
        $("#new-chat-options").addClass("hidden");
        $("#join-chat-options").addClass("hidden");
        $("#open-chat-options").addClass("hidden");
        userWebId = null;
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * This method checks if a new message has been made by the friend.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotifications() {
    ////console.log("Checking for new notifications");

    const updates = await baseService.checkUserInboxForUpdates(await baseService.getInboxUrl(userWebId)); //HECHO
    ////console.log(updates);

    updates.forEach(async (fileurl) => {

        ////console.log(fileurl);

        // check for new
        let newMessageFound = false;
        let message = await messageService.getNewMessage(fileurl, userWebId);
        if (message) {
            //console.log("Guardando mensajes");

            newMessageFound = true;
            var nameThroughUrl;
            var authorUrl;
			console.log(message);
            if (!message.author.includes("Group")) {
                nameThroughUrl = message.author.split("/").pop();
                authorUrl = message.messageUrl.split("priv")[0] + "profile/card#me";
            } else {
                nameThroughUrl = message.author.split("/")[1];
                authorUrl = message.inboxUrl.split("inbox")[0] + "profile/" + message.author.split("/")[0] + "/" + message.author.split("/")[1];
				console.log(authorUrl);
            }
            //console.log("nombre de authorUrl is:" + nameThroughUrl);
            //console.log("original interlocutorName is:" + $("#interlocutorw-name").text());
            //console.log(message);

            //console.log(authorUrl);
            //console.log(contactsWithChat);
            if (nameThroughUrl === $("#interlocutorw-name").text()) {
                interlocutorMessages.push(message);
                await showAndStoreMessages();
            } else if (contactsWithChat.indexOf(authorUrl) != -1) {
                //console.log("NEW MESSAGE - SITUATION B");
                var index = contactsWithChat.indexOf(authorUrl);
                $("#chatwindow" + index).remove();
                var parsedmessage = message.messagetext.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
                var html = $("<div class='contact new-message-contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName + "</h1><p class='font-preview' id='lastMsg"
                    + index + "'>" + parsedmessage
                    + "</p></div></div><div class='contact-time'><p>"
                    + semanticChats[index].getHourOfMessage(semanticChats[index].numberOfMessages - 1)
                    + "</p><div class='new-message' id='nm" + index + "'><p>" + "1" + "</p></div></div></div>");
                $(".contact-list").prepend(html);
                document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
                interlocutorMessages.push(message);
            } else if (openChat) {
                interlocutorMessages.push(message);
            }
        }

        if (!newMessageFound) {
            const convoToJoin = await joinService.getJoinRequest(fileurl, userWebId);

            if (convoToJoin) {
                $("#showinvs").show();
                //console.log("Procesando nuevo chat");
                //console.log("chatToJoin: " + convoToJoin + "," + fileurl + "," + userWebId + "," + userDataUrl);
                chatsToJoin.push(await joinService.processChatToJoin(convoToJoin, fileurl, userWebId, userDataUrl));
                alert("New invitations. They shall be dismissed if not accepted on this session.");
            }
        }
    });
    if (chatsToJoin.length === 0) {
        $("#showinvs").hide();
    }
    // //console.log(semanticChats);
    // //console.log(contactsWithChat);
}


async function loadMessages(id) {
    $(".chat").html("");
    $("#nm" + id).remove();
    currentChat = semanticChats[id];
    userDataUrl = currentChat.url;
    // //console.log(semanticChats);
    var friendPhoto = currentChat.photo;
    if (!friendPhoto) {
        friendPhoto = baseService.getDefaultFriendPhoto();
    }
    $("#interlocutorphoto").attr("src", friendPhoto);
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

    if (e.keyCode == "13" && $("#write-chat").val() != "") {
        const username = $("#user-name").text();
        const message = $("#write-chat").val();
        var dateFormat = require("date-fns");
        var now = new Date();
        const ttime = "21" + dateFormat.format(now, "yy-MM-dd") + "T" + dateFormat.format(now, "HH-mm-ss");
        //console.log(currentChat);
        if (currentChat.interlocutorWebId.includes("Group"))
            await messageService.storeMessage(userDataUrl, currentChat.interlocutorWebId.split("profile/").pop() + "/" + username, userWebId, ttime, message, interlocWebId, true, currentChat.members);
        else
            await messageService.storeMessage(userDataUrl, username, userWebId, ttime, message, interlocWebId, true, null);

        $("#write-chat").val("");
        var index = contactsWithChat.indexOf(currentChat.interlocutorWebId.replace("Group/", ""));
        if (index == -1)
            index = contactsWithChat.indexOf(currentChat.interlocutorWebId);
        //console.log("Index es " + index);
        $("#chatwindow" + index).remove();

        semanticChats[index].loadMessage({
            messagetext: message,
            url: null,
            author: username,
            time: ttime
        });

        const parsedmessage = message.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
        $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>"
            + parsedmessage + "</div><div class='time'>" +
            ttime.substring(11, 16).replace("\-", "\:") + "</div></div>");

        toScrollDown();

        if (!showingContacts) {
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName
                + "</h1><p class='font-preview' id='lastMsg" + index + "'>"
                + parsedmessage + "</p></div></div><div class='contact-time'><p>"
                + semanticChats[index].getHourOfMessage(semanticChats[index].getNumberOfMsgs() - 1);
            +"</p></div></div>";

            $(".contact-list").prepend(html);
            document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
        }
    }
}

//_____________________________IMAGE_UPLOADS__________________//

$('#join-media').on('change', function () {
    const username = $("#user-name").text();
    var toSend = this;
    alert("This feature only works if you have enough storage in your pod."
        + "So if you don't find the image stored in it, it's because you have low storage capacity.");
    imagesToSend(toSend, userDataUrl, username, userWebId, interlocWebId, currentChat, semanticChats);
});

function imagesToSend(input, userDataUrl, username, userWebId, interlocWebId, currentChat, semanticChats) {
    if (input.files) {
        var filesAmount = input.files.length;
        var i = 0;
        var index = contactsWithChat.indexOf(currentChat.interlocutorWebId.replace("Group/", ""));
        if (index == -1)
            index = contactsWithChat.indexOf(currentChat.interlocutorWebId);

        for (i = 0; i < filesAmount; i++) {
            var reader = new FileReader();
            reader.onload = async function (event) {
                var now = new Date();
                var dateFormat = require("date-fns");
                const ttime = "21" + dateFormat.format(now, "yy-MM-dd") + "T" + dateFormat.format(now, "HH-mm-ss");
                var img = "<img alt = 'uploaded'  style='height:200px; width:200px;' src = '" + event.target.result + "'" + "/>";
                //SENDING MESSAGE
                if (currentChat.interlocutorWebId.includes("Group"))
                    await messageService.storeMessage(userDataUrl, currentChat.interlocutorWebId.split("profile/").pop() + "/" + username, userWebId, ttime, event.target.result, interlocWebId, true, currentChat.members);
                else
                    await messageService.storeMessage(userDataUrl, username, userWebId, ttime, event.target.result, interlocWebId, true, null);

                $("#chatwindow" + index).remove();

                semanticChats[index].loadMessage({
                    messagetext: event.target.result,
                    url: null,
                    author: username,
                    time: ttime
                });

                $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + img + "</div><div class='time'>" +
                    ttime.substring(11, 16).replace("\-", "\:") + "</div></div>");

                toScrollDown();

                if (!showingContacts) {
                    var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName
                        + "</h1><p class='font-preview' id='lastMsg" + index + "'>" + "<img alt = 'uploaded' src = '" + event.target.result + "'" + "/>"
                        + "</p></div></div><div class='contact-time'><p>"
                        + semanticChats[index].getHourOfMessage(semanticChats[index].getNumberOfMsgs() - 1);
                    +"</p></div></div>";
                    $(".contact-list").prepend(html);
                    document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
                }
            }
            reader.readAsDataURL(input.files[i]);
        }
    }
};
//__________________________________________-_______________//


//_____________________________VIDEO_UPLOADS__________________//

$('#join-video').on('change', function () {
    alert("This feature only works if you have enough storage in your pod."
        + "So if you don't find the video stored in it, it's because you have low storage capacity.");
    const username = $("#user-name").text();
    //videosPreview(this, $z);
    var toSend = this;
    videosToSend(toSend, userDataUrl, username, userWebId, interlocWebId, currentChat, semanticChats);
});

function videosToSend(input, userDataUrl, username, userWebId, interlocWebId, currentChat, semanticChats) {
    if (input.files) {
        var filesAmount = input.files.length;
        var i = 0;
        var index = contactsWithChat.indexOf(currentChat.interlocutorWebId.replace("Group/", ""));
        if (index == -1)
            index = contactsWithChat.indexOf(currentChat.interlocutorWebId);

        for (i = 0; i < filesAmount; i++) {
            var reader = new FileReader();
            reader.onload = async function (event) {
                var now = new Date();
                var dateFormat = require("date-fns");
                const ttime = "21" + dateFormat.format(now, "yy-MM-dd") + "T" + dateFormat.format(now, "HH-mm-ss");
                var video = "<video width='200' height='200' controls> <source src= '" + event.target.result
                    + "'> Your browser does not support HTML5 video. </video>";
                //SENDING MESSAGE
                if (currentChat.interlocutorWebId.includes("Group"))
                    await messageService.storeMessage(userDataUrl, currentChat.interlocutorWebId.split("profile/").pop() + "/" + username, userWebId, ttime, event.target.result, interlocWebId, true, currentChat.members);
                else
                    await messageService.storeMessage(userDataUrl, username, userWebId, ttime, event.target.result, interlocWebId, true, null);

                $("#chatwindow" + index).remove();

                semanticChats[index].loadMessage({
                    messagetext: event.target.result,
                    url: null,
                    author: username,
                    time: ttime
                });

                $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>" + video + "</div><div class='time'>" +
                    ttime.substring(11, 16).replace("\-", "\:") + "</div></div>");

                toScrollDown();

                if (!showingContacts) {
                    var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName
                        + "</h1><p class='font-preview' id='lastMsg" + index + "'>" + "<video width='20' height='20'> <source src= '" + event.target.result + "'> Your browser does not support HTML5 video. </video>"
                        + "</p></div></div><div class='contact-time'><p>"
                        + semanticChats[index].getHourOfMessage(semanticChats[index].getNumberOfMsgs() - 1);
                    +"</p></div></div>";
                    $(".contact-list").prepend(html);
                    document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
                }
            }
            reader.readAsDataURL(input.files[i]);
        }
    }
};
//_________________________________________________________________//


//_____________________________TEXT_UPLOADS__________________//
$('#join-text').on('change', function () {
    const username = $("#user-name").text();
    var toSend = this;
    alert("This feature only works if you have enough storage in your pod."
        + "So if you don't find the text file stored in it, it's because you have low storage capacity.");
    textsToSend(toSend, userDataUrl, username, userWebId, interlocWebId, currentChat, semanticChats);
});

function textsToSend(input, userDataUrl, username, userWebId, interlocWebId, currentChat, semanticChats) {
    if (input.files) {
        var filesAmount = input.files.length;
        var i = 0;
        var index = contactsWithChat.indexOf(currentChat.interlocutorWebId.replace("Group/", ""));
        if (index == -1)
            index = contactsWithChat.indexOf(currentChat.interlocutorWebId);

        for (i = 0; i < filesAmount; i++) {
            var reader = new FileReader();
            reader.onload = async function (event) {
                var now = new Date();
                var dateFormat = require("date-fns");
                const ttime = "21" + dateFormat.format(now, "yy-MM-dd") + "T" + dateFormat.format(now, "HH-mm-ss");
                var lnk = "<a target='_blank' href='" + event.target.result
                    + "' style='padding: 10px;margin : 5px;background-color: darkgrey;color : white;  border-radius: 15px;' >"
                    + $('#join-text').val().split('\\').pop() + "</a>";                //SENDING MESSAGE

                if (currentChat.interlocutorWebId.includes("Group"))
                    await messageService.storeMessage(userDataUrl, currentChat.interlocutorWebId.split("profile/").pop() + "/" + username, userWebId, ttime, event.target.result, interlocWebId, true, currentChat.members);
                else
                    await messageService.storeMessage(userDataUrl, username, userWebId, ttime, event.target.result, interlocWebId, true, null);

                $("#chatwindow" + index).remove();

                semanticChats[index].loadMessage({
                    messagetext: event.target.result,
                    url: null,
                    author: username,
                    time: ttime
                });

                $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>"
                    + lnk + "</div><div class='time'>" +
                    ttime.substring(11, 16).replace("\-", "\:") + "</div></div>");

                toScrollDown();

                if (!showingContacts) {
                    var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName
                        + "</h1><p class='font-preview' id='lastMsg" + index + "'>"
                        + $('#join-text').val().split('\\').pop()
                        + "</p></div></div><div class='contact-time'><p>"
                        + semanticChats[index].getHourOfMessage(semanticChats[index].getNumberOfMsgs() - 1);
                    +"</p></div></div>";
                    $(".contact-list").prepend(html);
                    document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
                }
            }
            reader.readAsDataURL(input.files[i]);
        }
    }
};

//_____________________________________________//

async function showAndStoreMessages() {
    var i = 0;
    ////console.log("interloc WEBID is :" + interlocWebId); //Decker.solid.community/....

    while (i < interlocutorMessages.length) {
        ////console.log("interloc author is: " + interlocutorMessages[i].author); //...../Deker //Yarrick is better
        var nameThroughUrl;
		console.log(interlocutorMessages[i].author);
        if (!interlocutorMessages[i].author.includes("Group"))
            nameThroughUrl = interlocutorMessages[i].author.split("/").pop();
        else
            nameThroughUrl = interlocutorMessages[i].author.split("/")[1];
        //console.log("nombre de authorUrl is:" + nameThroughUrl);
        //console.log("original interlocutorName is:" + $("#interlocutorw-name").text());
        if (nameThroughUrl === $("#interlocutorw-name").text()) {
            showMessage(interlocutorMessages[i]);
            await messageService.storeMessage(userDataUrl, interlocutorMessages[i].author.split("/").pop(), userWebId, interlocutorMessages[i].time, interlocutorMessages[i].messagetext, interlocWebId, false);
            var index = contactsWithChat.indexOf(interlocWebId);
            if (index == -1)
                index = contactsWithChat.indexOf(interlocWebId.replace("Group/", ""));
            semanticChats[index].loadMessage({
                messagetext: interlocutorMessages[i].messagetext,
                url: null,
                author: interlocutorMessages[i].author.split("/").pop(),
                time: interlocutorMessages[i].time
            });
            baseService.deleteFileForUser(interlocutorMessages[i].inboxUrl);
            $("#chatwindow" + index).remove();

            var msgToShow;
            if (interlocutorMessages[i].messagetext.includes("data:image")) {
                msgToShow = "<img alt = 'uploaded' src = '" + interlocutorMessages[i].messagetext + "'" + "/>";
            } else if (interlocutorMessages[i].messagetext.includes("data:video")) {
                msgToShow = "<video controls> <source src= '" + interlocutorMessages[i].messagetext + "'> Your browser does not support HTML5 video. </video>";
            } else if (interlocutorMessages[i].messagetext.includes("data:text")) {
                msgToShow = "<a class='disable' href='" + interlocutorMessages[i].messagetext + "'>" + "Click to view text file</a>";
            } else {
                msgToShow = interlocutorMessages[i].messagetext.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
            }
            const parsedmessage = msgToShow;

            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + index + "'><img src='" + semanticChats[index].photo + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + semanticChats[index].interlocutorName
                + "</h1><p class='font-preview' id='lastMsg" + index + "'>" + parsedmessage
                + "</p></div></div><div class='contact-time'><p>"
                + semanticChats[index].getHourOfMessage(semanticChats[index].numberOfMessages - 1) + "</p></div></div>";
            $(".contact-list").prepend(html);
            document.getElementById("chatwindow" + index).addEventListener("click", loadMessagesToWindow, false);
            interlocutorMessages[i] = "D";
            //console.log("Matching names. All Correct");
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
    var msgToBeShown;
    if (message.messagetext.includes("data:image")) {
        msgToBeShown = "<img alt = 'uploaded' style='height:200px; width:200px;' src = '" + message.messagetext + "' />";
    } else if (message.messagetext.includes("data:video")) {
        msgToBeShown = "<video width='200' height='200' controls> <source src= '"
            + message.messagetext + "'> Your browser does not support HTML5 video. </video>";
    } else if (message.messagetext.includes("data:text")) {
        msgToBeShown = "<a target='_blank' href='" + message.messagetext
            + "' style='padding: 10px;margin : 5px;background-color: darkgrey;color : white;  border-radius: 15px;' >"
            + "Click to view text file</a>";
    } else {
        msgToBeShown = message.messagetext.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
    }
    console.log(msgToBeShown);
    if (message.author.split("/").pop().replace(/U\+0020/g, " ") === $("#user-name").text()) {
        $(".chat").append("<div class='chat-bubble me'><div class='my-mouth'></div><div class='content'>"
            + msgToBeShown + "</div><div class='time'>" +
            message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
    } else {
        if (currentChat.interlocutorWebId.includes("Group")) {
            $(".chat").append("<div class='chat-bubble you'><div class='your-mouth'></div><h4>"
                + message.author.split("/").pop().replace(/U\+0020/g, " ") + "</h4><div class='content'>"
                + msgToBeShown + "</div><div class='time'>" +
                message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        } else {
            $(".chat").append("<div class='chat-bubble you'><div class='your-mouth'></div><div class='content'>"
                + msgToBeShown + "</div><div class='time'>" +
                message.time.substring(11, 16).replace("\-", "\:") + "</div></div>");
        }
    }
    $(".fa fa-bars fa-lg").removeClass("hidden");
    toScrollDown();
}

//EMOJIS

$("#show-contact-information").click(async () => {
    $(".chat-head i").hide();
    $(".chat-head label").hide();
    $(".information").css("display", "flex");
    $("#close-contact-information").show();
    //console.log(currentChat);
    var note;
    if (!interlocWebId.includes("Group")) {
        note = await baseService.getNote(interlocWebId);
    }
    if (!note) {
        note = "Nothing to see here";
    }
    $(".information").append("<img src='" + currentChat.photo + "'><div><h1>Name:</h1><p>" + currentChat.interlocutorName + "</p><h1>Status:</h1><p>" + note + "</p></div>");
    if (interlocWebId.includes("Group")) {
        $(".information").append("<div id='listGroups'><h1>Participants:</h1></div>");
		console.log(currentChat);
        for (var i = 0; i < currentChat.members.length; i++) {
			console.log(currentChat.members[i]);
            var memberPhoto = await baseService.getPhoto(currentChat.members[i].id ? currentChat.members[i].id : currentChat.members[i]);
            if (!memberPhoto) {
                memberPhoto = baseService.getDefaultFriendPhoto();
            }
            var memberName = await baseService.getFormattedName(currentChat.members[i].id ? currentChat.members[i].id : currentChat.members[i]);
            var html = $("<div class='listGroups'><img src='" + memberPhoto + "'><p>" + memberName + "</p></div>");
            $("#listGroups").append(html);

        }
    }
});

$("#close-contact-information").click(async () => {
    $(".chat-head i").show();
    $(".chat-head label").show();
    $("#close-contact-information").hide();
    $(".information >").remove();
    $(".information").hide();
});

$("#show-contacts").click(async () => {
    if (contactsToOpen) {
        contactsToOpen = false;
    } else {
        contactsToOpen = true;
    }
    await displayContacts(openContact);
});

async function displayContacts(func) {
    $(".contact-list").html("");
    $("#data-url").prop("value", baseService.getDefaultDataUrl(userWebId));
    if (!showingContacts) {
        $(".search").addClass("hidden");
        $(".addcontact").removeClass("hidden");
        $(".writecontact").removeClass("hidden");
    } else {
        $(".search").removeClass("hidden");
        $(".addcontact").addClass("hidden");
        $(".writecontact").addClass("hidden");
    }

    if (!showingContacts) {
		$("#show-contacts").addClass("hidden");
		$("#create-group").addClass("hidden");

        for await (const friend of data[userWebId].friends) {
            let name = await baseService.getFormattedName(friend.value);
            var friendPhoto = await baseService.getPhoto(friend.value);
            if (!friendPhoto) {
                friendPhoto = baseService.getDefaultFriendPhoto();
            }

            var html = "<div style='cursor: pointer;' class='contact' id='openchatwindow" + friend.value + "'><img src='"
                + friendPhoto + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>"
                + name + "</h1><p class='font-preview' id='ctmsg" + friend.value.split("/")[2].split(".")[0]
                + "'></p></div></div><div class='contact-time'><p>" + "</p></div></div>";

            $(".contact-list").prepend(html);
            document.getElementById("openchatwindow" + friend.value).addEventListener("click", func, false);

        }
        showingContacts = true;
		$("#show-contacts").removeClass("hidden");
		$("#create-group").removeClass("hidden");
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
            if (lastMsg.includes("data:image")) {
                lastMsg = "<img alt = 'uploaded' src = '" + lastMsg + "'" + "/>";
            } else if (lastMsg.includes("data:video")) {
                lastMsg = "<video width='20' height='20'> <source src= '" + lastMsg + "'> Your browser does not support HTML5 video. </video>";
                //console.log("showChatslastMsg in showChats" + lastMsg);
            } else if (lastMsg.includes("data:text")) {
                lastMsg = "<a class='disable' href='" + lastMsg + "'>"
                    + "Text File</a>";
            } else {
                lastMsg = lastMsg.replace(/\:(.*?)\:/g, "<img src='main/resources/static/img/$1.gif' alt='$1'></img>");
            }
            lastHr = chat.getHourOfMessage(chat.getMessages().length - 1);
        }

        const newmsg = 0;

        if (newmsg === 0) {
            var html;
            var html = "<div style='cursor: pointer;' class='contact' id='chatwindow" + chatCounter + "'><img src='" + chat.photo
                + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>"
                + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg"
                + chatCounter + "'>"
                + lastMsg
                + "</p></div></div><div class='contact-time'><p>" + lastHr + "</p></div></div>";
        } else {
            var html = $("<div style='cursor: pointer;' class='contact new-message-contact' id='chatwindow"
                + chatCounter + "'><img src='" + chat.photo
                + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>"
                + chat.interlocutorName + "</h1><p class='font-preview' id='lastMsg" + chatCounter + "'>"
                + lastMsg
                + "</p></div></div><div class='contact-time'><p>" + "?" + "</p><div class='new-message' id='nm"
                + lastHr + "'><p>" + "1" + "</p></div></div></div>");
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
    // //console.log(contactsWithChat);
    // //console.log(this.getAttribute("id").replace("openchatwindow", ""));
    // //console.log(index);
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
            //console.log(semanticChat);
            //console.log(contactsWithChat);
            loadMessages(index);
        } else {
            $("#write-permission-url").text(dataUrl);
            $("#write-permission").modal("show");
        }
    }

}

$("#showinvs").click(async () => {
    await showInvitations();
});

async function showInvitations() {
    $(".contact-list").html("");
    chatsToJoin.forEach(async chat => {
        var friendPhoto = chat.photo;

        if (!friendPhoto) {
            friendPhoto = await baseService.getPhoto(chat.interlocutorWebId);
            if (!friendPhoto)
                friendPhoto = baseService.getDefaultFriendPhoto();
        }

        var html = $("<div style='cursor: pointer;' class='contact new-message-contact' id='join" + chat.url + "'><img src='" + friendPhoto + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + chat.interlocutorName + "</h1><p class='font-preview'>Wants to chat with you</p></div></div><div class='contact-time'><p>" + "</p><div class='new-message' id='nm" + "'><p>" + "1" + "</p></div></div></div>");
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
    userDataUrl = await baseService.getDefaultDataUrl(userWebId);
    chat.url = await baseService.generateUniqueUrlForResource(userDataUrl);
    await joinService.joinExistingChat(userDataUrl, chat.interlocutorWebId, userWebId, chat.url, chat.interlocutorName, chat.members);

    var friendPhoto = chat.photo;

    if (!friendPhoto) {
        friendPhoto = await baseService.getPhoto(chat.interlocutorWebId);
        if (!friendPhoto)
            friendPhoto = baseService.getDefaultFriendPhoto();
    }
    chat.photo = friendPhoto;

    //console.log("Chat to join should have loaded");
    //console.log(chat);

    semanticChats.push(chat);
    var index = semanticChats.indexOf(chat);
    if (chat.members)
        contactsWithChat.splice(index, 0, chat.interlocutorName);
    else
        contactsWithChat.splice(index, 0, chat.interlocutorWebId);
    //console.log(semanticChats);
    //console.log(contactsWithChat);

    await showChats();
    await loadMessages(index);
    await showAndStoreMessages();
}

function randomPhrase() {
	const phrases = [
		"For those who seek perfection there can be no rest on this side of the grave.",
		"Success is commemorated; Failure merely remembered.",
		"Even a man who has nothing can still offer his time.",
		"It is better to code for the Emperor than to live for yourself.",
		"True Happiness stems only from Duty.",
		"Without Javascript there is nothing.",
		"Victory needs no explanation, defeat allows none.",
		"Walk softly, and make an intricate encryption.",
		"The Emperor guides my resolve.",
		"He who stands with JS shall be my brother.",
		"Duty earns salvation.",
		"Heresy grows from idleness.",
		"A suspicious mind is a healthy mind.",
		"Foolish are those who fear nothing, yet claim to know everything.",
		"We win this day or we die trying! There is no retreat!",
		"To each of us falls a task, and all the Emperor requires of us Engineers is that we stand the line.",
		"We are all pawns of something even greater: memes, the DNA of the soul.",
		"Nanomachines, Son. They harden in response to physical trauma.",
		"Every lone spirit doubts his strength.",
		"Excuses are the refuge of the weak.",
		"Facts are chains that bind perception and fetter truth. For a man can remake the world if he has a dream and no facts to cloud his mind.",
		"Hard work conquers everything.",
		"He who lives for nothing is nothing.",
		"Honor is what a pure mind knows about itself.",
		"Hope is the first step on the road to disappointment."
	];
	$(".phrase").text(phrases[Encrypter.randomNumber(phrases.length)]);
}

function toScrollDown() {
    var elem = document.getElementById("chatdiv");
    elem.scrollTop = elem.scrollHeight;
}

$("#create-group").click(async () => {
    if (!showingContacts) {
        $(".search").addClass("hidden");
        $(".creategroup").removeClass("hidden");
        $(".writegroup").removeClass("hidden");
        $(".addcontact").removeClass("hidden");
        $(".writecontact").removeClass("hidden");
        contactsToOpen = false;
    } else {
        $(".search").removeClass("hidden");
        $(".creategroup").addClass("hidden");
        $(".writegroup").addClass("hidden");
        $(".addcontact").addClass("hidden");
        $(".writecontact").addClass("hidden");
    }
    await displayContacts(markContactForGroup);
});

async function markContactForGroup() {
    var intWebId = this.getAttribute("id").replace("openchatwindow", "");
    var index = contactsForGroup.indexOf(intWebId);
    if (index == -1) {
        //console.log("ctmsg" + intWebId.split("/")[2]);
        $("#ctmsg" + intWebId.split("/")[2].split(".")[0]).html("Selected");
        contactsForGroup.push(intWebId);
    } else {
        $("#ctmsg" + intWebId.split("/")[2].split(".")[0]).html("");
        contactsForGroup.splice(index, 1);
    }
}

$("#creategroup").click(async () => {

    if ($(".input-group").val() != "") {
        if (contactsForGroup.length >= 2) {
            const dataUrl = baseService.getDefaultDataUrl(userWebId);
            userDataUrl = dataUrl;
            //console.log(contactsForGroup);
            //console.log($(".input-group").val());
            //console.log(userDataUrl);
            //console.log(userWebId);
            var intWebId = $(".input-group").val();
            //console.log(intWebId);
            var group = await createService.setUpNewGroup(userDataUrl, userWebId, contactsForGroup, intWebId);
            //console.log(group);
            semanticChats.push(group);
            var index = semanticChats.indexOf(group);
            contactsWithChat.splice(index, 0, "Group/" + intWebId);
            //console.log(semanticChats);
            //console.log(contactsWithChat);
            loadMessages(index);
            await showChats();
            showingContacts = false;
            $(".creategroup").addClass("hidden");
            $(".writegroup").addClass("hidden");
            $(".search").removeClass("hidden");
            contactsForGroup = [];
        } else {
            alert("You need at least 2 contacts to start a group.");
        }
    } else {
        alert("Group has no name.");
    }

});

$("#addcontact").click(async () => {

    if ($(".input-contact").val() != "") {
        await lookForUsername($(".input-contact").val().toLowerCase(), "solid.community");
		await lookForUsername($(".input-contact").val().toLowerCase(), "inrupt.net");
    } else {
        alert("No username specified.");
    }

});

async function lookForUsername(name, provider) {
	var contact = "https://" + name + "." + provider + "/profile/card#me";
	var permission;
	try {
		permission = await baseService.readPermission(contact);
	} catch (err) {
		permission = false;
	}
	console.log(permission);
        if (permission) {

            let name = await baseService.getFormattedName(contact);
            var friendPhoto = await baseService.getPhoto(contact);
            if (!friendPhoto) {
                friendPhoto = baseService.getDefaultFriendPhoto();
            }

            var html = "<div style='cursor: pointer;' class='contact' id='openchatwindow" + contact + "'><img src='" + friendPhoto + "' alt='!' onerror='this.onerror=null;this.src='http://www.philosophica.info/voces/aquino/Aquino.jpg';'><div class='contact-preview'><div class='contact-text'><h1 class='font-name'>" + name + "</h1><p class='font-preview' id='ctmsg" + contact.split("/")[2].split(".")[0] + "'></p></div></div><div class='contact-time'><p>" + "</p></div></div>";

            $(".contact-list").prepend(html);
            document.getElementById("openchatwindow" + contact).addEventListener("click", contactsToOpen ? openContact : markContactForGroup, false);
        } else {
            alert("No user found with web id " + contact);
        }
}
