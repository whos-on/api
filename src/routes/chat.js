const express = require("express");
const User = require("../databases/schema/users");
const Chat = require("../databases/schema/chats");
const { request, response } = require("express");
const router = express.Router();

//Create a new chat between users
//Incoming: users involved (array of username strings, where users[0] is the creator), a starting message
//Outgoing: a chat is created and added to all the involved users' chat arrays, empty error/status 201
router.post("/create", (request, response) => {
  let users = [];
  for (let i = 0; i < request.body.users.length; i++) {
    users[i] = request.body.users[i];
  }
  const message = request.body.message;
  const messageObj = {
    sender: users[0],
    contents: message,
    timestamp: Date.now(),
  };
  let checkedTimes = [];
  for (let i = 0; i < users.length; i++) {
    checkedTimes[i] = new Date(0);
  }
  checkedTimes[0] = Date.now();
  const newChat = new Chat({
    people: users,
    messages: messageObj,
    lastChecked: checkedTimes,
  });
  newChat
    .save()
    .then(async function () {
      for (let i = 0; i < users.length; i++) {
        await User.findOneAndUpdate(
          { username: users[i] },
          { $push: { chats: newChat._id } }
        ).catch((err) => {
          response.status(404).send({ error: err });
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
  response.status(201).send({ error: null });
});

// Send message between users in a same room
// Incoming: id of the message group and who is the one to send the message
// Outgoing: a new message has been sent
router.post("/sendMessage", async (request, response) => {
  const chatId = request.body.id;
  const sender = request.body.sender;
  const message = request.body.message;

  // Check if chat room exists
  const chatRoom = await Chat.findById(chatId);

  if (!chatRoom) {
    response.status(404).send({ error: "Chat room not found" });
    return;
  }

  // Check if sender is a member of the chat room
  if (!chatRoom.people.includes(sender)) {
    response
      .status(403)
      .send({ error: "Sender is not a member of the chat room" });
    return;
  }

  const userArray = chatRoom.people;
  let index = 0;
  for (let i = 0; i < chatRoom.people.length; i++) {
    if (chatRoom.people[i] == sender) {
      index = i;
      break;
    }
  }
  // Add message to existing chat room
  const newMessage = {
    sender: sender,
    contents: message,
    timestamp: Date.now(),
  };

  try {
    await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: newMessage },
        $set: { [`lastChecked.${index}`]: Date.now() },
      },
      { multi: true }
    );
  } catch (err) {
    response.status(500).send({ error: err });
    return;
  }
  response.status(200).send({ error: null });
});

// User want to leave a chat in the same room
// Review chatId and userId

router.post("/leave", async (request, response) => {
  const chatId = request.body.chatId;
  const userId = request.body.userId;

  // Check if chat room exists
  const chatRoom = await Chat.findById(chatId);

  const userProfile = await User.findById(userId);
  if (!userProfile) {
    response.status(404).send({ error: "Can't find the user" });
    return;
  }

  const username = userProfile.username;

  if (!chatRoom) {
    response.status(404).send({ error: "Chat room not found" });
    return;
  }
  // Check if sender is a member of the chat room
  if (!chatRoom.people.includes(username)) {
    response
      .status(403)
      .send({ error: "User is not a member of the chat room" });
    return;
  }

  try {
    await User.updateOne({ _id: userId }, { $pull: { chats: `${chatId}` } });
  } catch (err) {
    response.status(500).send({ error: err });
    return;
  }

  try {
    await Chat.findByIdAndUpdate(chatId, {
      $pull: { people: `${username}` },
    });
  } catch (err) {
    response.status(500).send({ error: err });
    return;
  }

  response.status(200).send({ error: null });
});

// ret.push(await Chat.findById(userObj.chats[i]))

//Get all chat objects with unread messages, based on lastChecked times
//Incoming: ID of the user who is logged in
//Outgoing: Array of chat objects with unread messsages, an array matching the number of unreads in each
router.get("/refreshMessages", async (request, response) => {
  //Return-array placeholders
  let unreadChats = [];
  let unreadCounts = [];
  //Declare user
  const userId = request.body.userId;
  let userObj = await User.findById(userId);
  if(!userObj) {
    response.status(404).send({error: "User ID does not match any user!"});
  }
  //Populate the chats for the user
  await User.findById(userId)
   .populate({
      path: "chats" // populate chats
   })
   .then(async (popUserObj) => {
      let chatObjs = [];
      for(let i = 0; i < popUserObj.chats.length; i++) {
        chatObjs[i] = popUserObj.chats[i];
      }
      if(!chatObjs) {
        response.status(200).send({chats: unreadChats, counts: unreadCounts});
      }
      //For each chat, check it's messages and see if we have unchecked ones
      for(let i = 0; i < chatObjs.length; i++) {
        //Get the index in the checked array (matches name) and then find when this person
        //last checked their messages
        const checkedIndex = chatObjs[i].people.indexOf(userObj.username);
        let checkedTime = chatObjs[i].lastChecked[checkedIndex];
        checkedTime = checkedTime.getTime();
        let newMessages = 0;
        let j = chatObjs[i].messages.length - 1;
        //Starting from the most recent messages, count all messages which were sent after the user last checked
        while((j > -1 && (checkedTime < chatObjs[i].messages[j].timestamp.getTime()))) {
          newMessages++;
          j--;
        }
        //Refresh the lastChecked time
        chatObjs[i].lastChecked[checkedIndex] = Date.now();
        chatObjs[i].save();
        if(newMessages > 0) {
          unreadChats.push(chatObjs[i]);
          unreadCounts.push(newMessages);
        }
      }
      //Success, send response
      response.status(200).send({chats: unreadChats, counts: unreadCounts}); 
  })  
  .catch(err => {
    if(err) response.status(500).send({error: err});
  });
});

module.exports = router;
