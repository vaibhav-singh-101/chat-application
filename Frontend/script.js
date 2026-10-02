// ===============================
// LOGIN CHECK
// ===============================

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");
const email = localStorage.getItem("email");

if (!token) {
    window.location.href = "login.html";
}


// ===============================
// SOCKET.IO CONNECTION
// ===============================

const socket = io("http://localhost:5000");


// ===============================
// VARIABLES
// ===============================

let selectedUser = null;
let allUsers = [];
let typingTimer;
let unreadMessages = {};



// ===============================
// HTML ELEMENTS
// ===============================

const profileBtn =
    document.getElementById("profileBtn");

const profileModal =
    document.getElementById("profileModal");

const closeProfile =
    document.getElementById("closeProfile");

const profileUsername =
    document.getElementById("profileUsername");

const profileEmail =
    document.getElementById("profileEmail");
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const usersList = document.getElementById("usersList");
const searchUser = document.getElementById("searchUser");

const chatWith = document.getElementById("chatWith");
const onlineStatus = document.getElementById("onlineStatus");

const typingStatus = document.getElementById("typingStatus");

const loggedUser = document.getElementById("loggedUser");
const logoutBtn = document.getElementById("logoutBtn");

const notificationBtn =
    document.getElementById("notificationBtn");


// ===============================
// SHOW LOGGED-IN USER
// ===============================

if (loggedUser) {
    loggedUser.innerText = "Logged in as: " + username;
}


// ===============================
// SOCKET CONNECT
// ===============================

socket.on("connect", () => {

    console.log("Connected to server:", socket.id);

    // Tell server that this user is online
    socket.emit("join", username);

});


// ===============================
// ONLINE USERS
// ===============================

socket.on("usersList", (users) => {

    console.log("Online users:", users);

    allUsers = users;

    displayUsers(users);


    // Update selected user's status
    if (selectedUser) {

        if (users.includes(selectedUser)) {

            onlineStatus.innerText = "🟢 Online";

        } else {

            onlineStatus.innerText = "⚫ Offline";

        }

    }

});


// ===============================
// DISPLAY USERS
// ===============================

function displayUsers(users) {

    usersList.innerHTML = "";

    users.forEach((user) => {

        // Don't show yourself
        if (user === username) {
            return;
        }

        const userButton = document.createElement("button");

        userButton.classList.add("user-button");


        // Unread count
        const unreadCount =
            unreadMessages[user] || 0;


        userButton.innerHTML = `

            <span class="user-name">
                🟢 ${user}
            </span>

            ${
                unreadCount > 0
                ?
                `<span class="unread-count">
                    ${unreadCount}
                </span>`
                :
                ""
            }

        `;


        userButton.addEventListener("click", () => {

            selectUser(user);

        });


        usersList.appendChild(userButton);

    });

}

// ===============================
// SEARCH USERS
// ===============================

if (searchUser) {

    searchUser.addEventListener("input", () => {

        const searchText =
            searchUser.value.toLowerCase().trim();


        const filteredUsers = allUsers.filter((user) => {

            return user
                .toLowerCase()
                .includes(searchText);

        });


        displayUsers(filteredUsers);

    });

}


// ===============================
// SELECT USER
// ===============================

function selectUser(user) {

    selectedUser = user;


    // Reset unread count
    unreadMessages[user] = 0;


    // Update users list
    displayUsers(allUsers);


    // Chat header
    chatWith.innerText = user;


    // Online status
    if (allUsers.includes(user)) {

        onlineStatus.innerText = "🟢 Online";

    } else {

        onlineStatus.innerText = "⚫ Offline";

    }


    // Clear chat
    chatBox.innerHTML = "";


    // Clear typing status
    typingStatus.innerText = "";


    // Load previous messages
    socket.emit("getPrivateMessages", {

        sender: username,

        receiver: selectedUser

    });

}

// ===============================
// LOAD OLD PRIVATE MESSAGES
// ===============================

socket.on("privateMessages", (messages) => {

    chatBox.innerHTML = "";


    messages.forEach((message) => {

        displayMessage(message);

    });


    chatBox.scrollTop = chatBox.scrollHeight;

});


// ===============================
// SEND MESSAGE
// ===============================

function sendMessage() {

    const message = messageInput.value.trim();


    // No user selected
    if (!selectedUser) {

        alert("Please select a user first.");

        return;

    }


    // Empty message
    if (!message) {

        return;

    }


    socket.emit("privateMessage", {

        sender: username,

        receiver: selectedUser,

        message: message

    });


    // Clear input
    messageInput.value = "";


    // Stop typing
    socket.emit("stopTyping", {

        sender: username,

        receiver: selectedUser

    });

}


// ===============================
// SEND BUTTON
// ===============================

sendBtn.addEventListener("click", () => {

    sendMessage();

});


// ===============================
// ENTER KEY SEND
// ===============================

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        sendMessage();

    }

});


// ===============================
// RECEIVE PRIVATE MESSAGE
// ===============================

socket.on("privateMessage", (data) => {

    console.log("Received message:", data);


    // =====================================
    // MESSAGE FROM ANOTHER USER
    // =====================================

    if (data.sender !== username) {

        // If currently chatting with sender
        if (selectedUser === data.sender) {

            displayMessage(data);

        }

        // If chatting with someone else
        else {

            if (!unreadMessages[data.sender]) {
                unreadMessages[data.sender] = 0;
            }

            unreadMessages[data.sender]++;

            displayUsers(allUsers);


            // =================================
            // SHOW BROWSER NOTIFICATION
            // =================================

            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                const notification =
                    new Notification(
                        `New message from ${data.sender}`,
                        {
                            body: data.message,
                            icon: "https://cdn-icons-png.flaticon.com/512/134/134914.png"
                        }
                    );


                // When notification is clicked
                notification.onclick = () => {

                    window.focus();

                    selectUser(data.sender);

                    notification.close();

                };

            }

        }

    }


    // =====================================
    // MESSAGE SENT BY CURRENT USER
    // =====================================

    else {

        if (selectedUser === data.receiver) {

            displayMessage(data);

        }

    }

});
// ===============================
// DISPLAY MESSAGE
// ===============================

function displayMessage(data) {

    const messageElement =
        document.createElement("div");

    messageElement.classList.add("message");


    // Sent / received
    if (data.sender === username) {

        messageElement.classList.add("sent");

    } else {

        messageElement.classList.add("received");

    }


    // Timestamp
    let messageTime = "";

    if (data.createdAt) {

        const date =
            new Date(data.createdAt);

        messageTime =
            date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

    }


    // Message status
    let statusHTML = "";


    if (data.sender === username) {

        if (data.status === "sent") {

            statusHTML =
                `<span class="message-status">✓</span>`;

        }

        else if (data.status === "delivered") {

            statusHTML =
                `<span class="message-status">✓✓</span>`;

        }

        else if (data.status === "read") {

            statusHTML =
                `<span class="message-status">✓✓</span>`;

        }

    }


    messageElement.innerHTML = `

        <strong>${data.sender}</strong>

        <div class="message-text">
            ${escapeHTML(data.message)}
        </div>

        <div class="message-time">

            ${messageTime}

            ${statusHTML}

        </div>

    `;


    chatBox.appendChild(messageElement);

    chatBox.scrollTop =
        chatBox.scrollHeight;

}
    


// ===============================
// TYPING INDICATOR
// ===============================

messageInput.addEventListener("input", () => {

    if (!selectedUser) {
        return;
    }


    // Tell receiver
    socket.emit("typing", {

        sender: username,

        receiver: selectedUser

    });


    // Clear previous timer
    clearTimeout(typingTimer);


    // Stop typing after 1 second
    typingTimer = setTimeout(() => {

        socket.emit("stopTyping", {

            sender: username,

            receiver: selectedUser

        });

    }, 1000);

});


// ===============================
// USER IS TYPING
// ===============================

socket.on("userTyping", (data) => {

    if (selectedUser === data.sender) {

        typingStatus.innerText =
            `${data.sender} is typing...`;

    }

});


// ===============================
// USER STOPPED TYPING
// ===============================

socket.on("userStoppedTyping", (data) => {

    if (selectedUser === data.sender) {

        typingStatus.innerText = "";

    }

});


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("token");

    localStorage.removeItem("username");


    socket.disconnect();


    window.location.href =
        "login.html";

});


// ===============================
// HTML SECURITY
// ===============================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

profileBtn.addEventListener("click", () => {

    profileUsername.innerText = username;

    profileEmail.innerText = email;

    profileModal.style.display = "flex";

});


profileModal.addEventListener("click", (event) => {

    if (event.target === profileModal) {

        profileModal.style.display = "none";

    }

});

// =====================================
// BROWSER NOTIFICATIONS
// =====================================

if (notificationBtn) {

    notificationBtn.addEventListener("click", async () => {

        if (!("Notification" in window)) {

            alert("Your browser does not support notifications.");
            return;

        }

        const permission =
            await Notification.requestPermission();

        if (permission === "granted") {

            notificationBtn.innerText =
                "🔔 Notifications Enabled";

            alert("Notifications enabled!");

        } else {

            alert("Notification permission was denied.");

        }

    });

}