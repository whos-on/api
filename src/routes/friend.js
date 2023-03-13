const express = require('express');
const router = express.Router();
const User = require("../databases/schema/users");

//Send a friend request to a user and add the user to the senders list of pending requests
//Incoming: user's object _id, username to search for
//Outgoing: status 200/error will be empty
router.put("/addFriend", async (request, response) => {
    const {user, search} = request.body;
    const userObj = await User.findById(user);
    //search by username for the requestee, if not found, return an error
    const friendReq = await User.findOne({username : search});
    if(!friendReq) {
        return response.status(404).send({error: "No user exists for that username!"});
    }
    User.findByIdAndUpdate(friendReq._id, { $push: { requests: userObj.username } });
    User.findByIdAndUpdate(user, { $push: { pending: friendReq.username } });
    return response.status(200).send({error: ""});
});

//Accept or reject a friend request, either way, remove the request from both sides
//Incoming: user's object _id, username of the request sender, 1 to accept or 0 to reject
//Outgoing: status 200/error will be empty
router.put("/processRequest", async (request, response) => {
    const {user, requester, accept} = request.body;
    const newFriendObj = User.findOne({username: requester});
    const newFriend = newFriendObj._id;
    //Check to see if the requester still exists
    if(!newFriendObj) {
        return response.status(404).send({error: "This user doesn't exist anymore!"});
    }
    //Remove the requester from your requests list, and remove the user from the requester's pending list
    User.findByIdAndUpdate(user, { $pull: { requests: requester } });
    User.findByIdAndUpdate(newFriend, { $pull: { pending: (User.findById(user)).username } });
    if(accept) {
        //Add both users to their respective friend lists
        User.findByIdAndUpdate(user, { $push: { friends: newFriend } });
        User.findByIdAndUpdate(newFriend, { $push: { friends: user } });
    }
    return response.status(200).send({error: ""});
});

//Retrieve documents for all friends on a user's friend list
//Incoming: user's object _id
//Outgoing: array of friend documents called friends
router.get("/retrieveFriends", async (request, response) => {
    const user = request.body;
    userObj = await User.findById(user);
    //our return array
    let _ret;
    await userObj.friends.forEach(id => {
        _ret.push(User.findById(id));
    });
    return response.status(200).send({friends: _ret});
});

//Find all friend documents that match a given query
//Incoming: user's object _id, username/firstName/lastName to search for
//Outgoing: array of matching friend documents called friends
router.get("/searchFriends", async (request, response) => {
    const {user, search} = request.body;
    userObj = User.findById(user);
    await userObj.friends.forEach(id => {
        //Flag for when our search comes up empty for this id
        let notFound = 0;
        //We $and with the id so that we only get users who are on the user's friend list
        let result = User.findOne( {$and: [{_id: id}, { $or: [{ username: search }, { firstName : search }, { lastName : search}] }] } )
        .catch(err => {
            notFound = 1;
        });
        if(!notFound)
            _ret.push(result);
    });
    return response.status(200).send({friends: _ret});
});

module.exports = router;