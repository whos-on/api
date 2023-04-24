const express = require('express');
const User = require('../databases/schema/users');
const Chat = require('../databases/schema/chats');
const router = express.Router();

//Create a new chat between users
//Incoming: users involved (array of username strings, where users[0] is the creator), a starting message
//Outgoing: a chat is created and added to all the involved users' chat arrays, empty error/status 201
router.post('/create', (request, response) => {
    let users = [];
    for(let i = 0; i < request.body.users.length; i++) {
        users[i] = request.body.users[i];
    }
    const message = request.body.message;
    const messageObj = {
        sender: users[0],
        contents: message,
        timestamp: Date.now()
    };
    let checkedTimes = [];
    for(let i = 0; i < users.length; i++) {
        checkedTimes[i] = new Date(0);
    }
    checkedTimes[0] = Date.now();
    const newChat = new Chat({
        people: users,
        messages: messageObj,
        lastChecked: checkedTimes
    });
    newChat.save()
    .then(async function() {
        for(let i = 0; i < users.length; i++) {
            await User.findOneAndUpdate({username: users[i]}, { $push: { chats: newChat._id } })
            .catch((err) => {
                response.status(404).send({error: err});
            });
        }
    })
    .catch(function (err) {
        console.log(err);
    });
    response.status(201).send({error: null});
});

module.exports = router;