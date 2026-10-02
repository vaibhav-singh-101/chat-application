const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const Message = require("./Models/Message");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());

app.use(express.json());


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error);
    });


// Authentication routes
app.use("/api/auth", authRoutes);


// Test route
app.get("/", (req, res) => {
    res.send("Chat Server Running...");
});


// Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const onlineUsers = {};

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    // ===============================
    // USER JOIN
    // ===============================

    socket.on("join", (username) => {

        socket.username = username;

        onlineUsers[username] = socket.id;

        console.log(username + " joined the chat");


        // Send online users to everyone

        io.emit(
            "usersList",
            Object.keys(onlineUsers)
        );

    });


    // ===============================
    // PRIVATE MESSAGE
    // ===============================

    socket.on("privateMessage", async (data) => {

    try {

        const { sender, receiver, message } = data;

        const newMessage = new Message({
            sender,
            receiver,
            message,
            status: "sent"
        });

        const savedMessage = await newMessage.save();

        console.log(`${sender} → ${receiver}: ${message}`);


        // Check whether receiver is online
        const receiverSocket = onlineUsers[receiver];


        // Message data
        const messageData = {
            _id: savedMessage._id,
            sender: savedMessage.sender,
            receiver: savedMessage.receiver,
            message: savedMessage.message,
            status: savedMessage.status,
            createdAt: savedMessage.createdAt
        };


        // Receiver is online
        if (receiverSocket) {

            // Update MongoDB status
            savedMessage.status = "delivered";

            await savedMessage.save();


            messageData.status = "delivered";


            // Send to receiver
            io.to(receiverSocket).emit(
                "privateMessage",
                messageData
            );

        }


        // Send back to sender
        socket.emit(
            "privateMessage",
            messageData
        );


    } catch (error) {

        console.error(
            "Private message error:",
            error
        );

    }

});
    // ===============================
    // PRIVATE CHAT HISTORY
    // ===============================

    socket.on(
        "getPrivateMessages",
        async ({ sender, receiver }) => {

            try {

                const messages =
                    await Message.find({

                        $or: [

                            {
                                sender: sender,
                                receiver: receiver
                            },

                            {
                                sender: receiver,
                                receiver: sender
                            }

                        ]

                    })
                    .sort({ createdAt: 1 });


                socket.emit(
                    "privateMessages",
                    messages
                );


            } catch (error) {

                console.error(
                    "History error:",
                    error
                );

            }

        }
    );


    // ===============================
    // TYPING START
    // ===============================

    socket.on("typing", ({ sender, receiver }) => {

        const receiverSocket =
            onlineUsers[receiver];

        if (receiverSocket) {

            io.to(receiverSocket).emit(
                "userTyping",
                {
                    sender: sender
                }
            );

        }

    });


    // ===============================
    // TYPING STOP
    // ===============================

    socket.on("stopTyping", ({ sender, receiver }) => {

        const receiverSocket =
            onlineUsers[receiver];

        if (receiverSocket) {

            io.to(receiverSocket).emit(
                "userStoppedTyping",
                {
                    sender: sender
                }
            );

        }

    });


    // ===============================
    // DISCONNECT
    // ===============================

    socket.on("disconnect", () => {

        const username =
            socket.username;


        if (username) {

            delete onlineUsers[username];

        }


        io.emit(
            "usersList",
            Object.keys(onlineUsers)
        );


        console.log(
            "User disconnected:",
            socket.id
        );

    });

});

                    

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});