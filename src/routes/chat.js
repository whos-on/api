const express = require("express")
const User = require("../databases/schema/users")
const Chat = require("../databases/schema/chats")
const router = express.Router()

//Create a new chat between users
//Incoming: users involved (array of username strings, where users[0] is the creator), a starting message
//Outgoing: a chat is created and added to all the involved users' chat arrays, id returned w/ 201 status
router.post("/create", (request, response) => {
    let users = []
    for (let i = 0; i < request.body.users.length; i++) {
        users[i] = request.body.users[i]
    }
    const message = request.body.message
    const messageObj = {
        sender: users[0],
        contents: message,
        timestamp: Date.now(),
    }
    let checkedTimes = []
    for (let i = 0; i < users.length; i++) {
        checkedTimes[i] = new Date(0)
    }
    checkedTimes[0] = Date.now()
    const newChat = new Chat({
        people: users,
        messages: messageObj,
        lastChecked: checkedTimes,
    })
    newChat
        .save()
        .then(async function () {
            for (let i = 0; i < users.length; i++) {
                await User.findOneAndUpdate(
                    { username: users[i] },
                    { $push: { chats: newChat._id } }
                ).catch((err) => {
                    response.status(404).send({ error: err })
                })
            }
        })
        .catch(function (err) {
            console.log(err)
        })
    response.status(201).send({ id: newChat._id })
})

// Send message between users in a same room
// Incoming: chatId, sender and message
// JSOn Format Example
/*
  {
    "id": "6443d54e2c2c719dc1603bd7",
    "sender": "GraftonL",
    "message": "How are you?"
  }
*/
// Outgoing: a new message has been sent
router.post("/sendMessage", async (request, response) => {
    const chatId = request.body.id
    const sender = request.body.sender
    const message = request.body.message

    // Check if chat room exists
    const chatRoom = await Chat.findById(chatId)

    if (!chatRoom) {
        response.status(404).send({ error: "Chat room not found" })
        return
    }

    // Check if sender is a member of the chat room
    if (!chatRoom.people.includes(sender)) {
        response
            .status(403)
            .send({ error: "Sender is not a member of the chat room" })
        return
    }

    const userArray = chatRoom.people
    let index = 0
    for (let i = 0; i < chatRoom.people.length; i++) {
        if (chatRoom.people[i] == sender) {
            index = i
            break
        }
    }
    // Add message to existing chat room
    const newMessage = {
        sender: sender,
        contents: message,
        timestamp: Date.now(),
    }

    try {
        await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: newMessage },
                $set: { [`lastChecked.${ index }`]: Date.now() },
            },
            { multi: true }
        )
    } catch (err) {
        response.status(500).send({ error: err })
        return
    }
    response.status(200).send({ error: null })
})

/* User want to leave a chat in the same room
// Incomming: chatId and userId
// Outgoing: user has successfully out of the message
JSOn Format example:
{
    "chatId": "6443d67097750e1d31be1709",
    "userId": "64094c978249a5505567b111"
}
*/
router.post("/leave", async (request, response) => {
    const chatId = request.body.chatId
    const userId = request.body.userId

    // Check if chat room exists
    const chatRoom = await Chat.findById(chatId)

    const userProfile = await User.findById(userId)
    if (!userProfile) {
        response.status(404).send({ error: "Can't find the user" })
        return
    }

    const username = userProfile.username

    if (!chatRoom) {
        response.status(404).send({ error: "Chat room not found" })
        return
    }
    // Check if sender is a member of the chat room
    if (!chatRoom.people.includes(username)) {
        response
            .status(403)
            .send({ error: "User is not a member of the chat room" })
        return
    }
    // remove the chatRoom from User Object
    try {
        await User.updateOne({ _id: userId }, { $pull: { chats: `${ chatId }` } })
    } catch (err) {
        response.status(500).send({ error: err })
        return
    }
    // remove the user from Chat Object
    try {
        await Chat.findByIdAndUpdate(chatId, {
            $pull: { people: `${ username }` },
        })
    } catch (err) {
        response.status(500).send({ error: err })
        return
    }

    response.status(200).send({ error: null })
})

// ret.push(await Chat.findById(userObj.chats[i]))

//Get all chat objects with unread messages, based on lastChecked times
//Incoming: ID of the user who is logged in
//Outgoing: Array of chat objects with unread messsages, an array matching the number of unreads in each
router.post("/refreshMessages", async (request, response) => {
    //Return-array placeholders
    let unreadChats = []
    let unreadCounts = []
    //Declare user
    const userId = request.body.userId
    let userObj = await User.findById(userId)
    if (!userObj) {
        response.status(404).send({ error: "User ID does not match any user!" })
    }
    //Populate the chats for the user
    await User.findById(userId)
        .populate({
            path: "chats", // populate chats
        })
        .then(async (popUserObj) => {
            let chatObjs = []
            for (let i = 0; i < popUserObj.chats.length; i++) {
                chatObjs[i] = popUserObj.chats[i]
            }
            if (!chatObjs) {
                response.status(200).send({ chats: unreadChats, counts: unreadCounts })
            }
            //For each chat, check it's messages and see if we have unchecked ones
            for (let i = 0; i < chatObjs.length; i++) {
                //Get the index in the checked array (matches name) and then find when this person
                //last checked their messages
                const checkedIndex = chatObjs[i].people.indexOf(userObj.username)
                let checkedTime = chatObjs[i].lastChecked[checkedIndex]
                checkedTime = checkedTime.getTime()
                let newMessages = 0
                let j = chatObjs[i].messages.length - 1
                //Starting from the most recent messages, count all messages which were sent after the user last checked
                while (
                    j > -1 &&
                    checkedTime < chatObjs[i].messages[j].timestamp.getTime()
                ) {
                    newMessages++
                    j--
                }
                //Refresh the lastChecked time
                chatObjs[i].lastChecked[checkedIndex] = Date.now()
                chatObjs[i].save()
                if (newMessages > 0) {
                    unreadChats.push(chatObjs[i])
                    unreadCounts.push(newMessages)
                }
            }
            //Success, send response
            response.status(200).send({ chats: unreadChats, counts: unreadCounts })
        })
        .catch((err) => {
            if (err) response.status(500).send({ error: err })
        })
})

/*
  /get will get all of the chat each user has
  // Incoming: userID
  // Outgoing: all of the chat room that user have
*/
router.post("/get", async (request, response) => {
    const id = request.body.id
    const user = await User.findById(id)

    if (!user) {
        response.status(404).send({ error: "User  not found" })
        return
    }

    const chatArray = user.chats
    if (chatArray.length == 0) {
        response.status(404).send({ error: "User doesn't have any conversation" })
        return
    }
    // const chatArr = [];

    // for (let i = 0; i < chatArray.length; i++) {
    //   chatArr.push(chatArray[i]);
    // }

    // if (chatArr.length == 0) {
    //   response.status(404).send({ error: "Not Success to get" });
    // }
    response.status(200).send(user.chats)
})

/*
  /getMessage will get all of the message currently in the chatRoom
  // Incoming: chatID
  // Outgoing: all of the message in the chat room
*/
router.post("/getMessage", async (request, response) => {
    const chatID = request.body.chatID
    const chatRoom = await Chat.findById(chatID)

    if (!chatRoom) {
        response.status(404).send({ error: "Chat room not found" })
        return
    }

    if (chatRoom.messages.length == 0) {
        response.status(404).send({ error: "Doesn't have any message" })
        return
    }
    response.status(200).send(chatRoom.messages)
})

/*
  Incoming: userId , message that need to search
  Outgoing: the chatID that content search keyword
*/
router.post("/search", async (request, response) => {
    const userId = request.body.id
    const search = request.body.search
    if (
        userId == null ||
        userId == undefined ||
        userId == "" ||
        search == null ||
        search == undefined
    )
        return response.status(400).send({ error: "Empty request." })
    userObj = await User.findById(userId)

    if (!userObj) {
        response.status(404).send({ error: "Can't find user." })
        return
    }
    let _ret = new Array()
    const regex = new RegExp(search, "i")

    for (let i = 0; i < userObj.chats.length; i++) {
        const chatObj = await Chat.findById(userObj.chats[i])
        for (let j = 0; j < chatObj.people.length; j++) {
            let contents = chatObj.people[j]
            if (contents.toLowerCase().match(regex)) {
                _ret.push(chatObj.id)
                break
            }
        }
    }

    if (_ret.length == 0) {
        response.status(404).send({ error: "Can't find chats" })
        return
    }

    response.status(200).send(_ret)
})

module.exports = router
