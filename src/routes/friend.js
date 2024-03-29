const express = require("express");
const router = express.Router();
const User = require("../databases/schema/users");

//Send a friend request to a user and add the user to the senders list of pending requests
//Incoming: user's object _id, username to search for
//Outgoing: status 200/error will be empty
router.put("/addFriend", async (request, response) => {
    const {id, search} = request.body;
    if(id == null || id == undefined || id == "" || search == null || search == undefined || search == "") return response.status(400).send({error: "Empty request."})
    const userObj = await User.findById(id);
    //search by username for the requestee, if not found, return an error
    const friendReq = await User.findOne({username : search});
    if(friendReq == null || friendReq == undefined) {
        return response.status(404).send({error: "No user exists for that username!"});
    }
    //Make sure that user isn't already friends with the receiver, and that they haven't already sent them a request
    for(let i = 0; i < userObj.friends.length; i++) {
        let friendObj = await User.findById(userObj.friends[i]);
        if(friendObj.username == search) return response.status(400).send({error: "You are already friends with this person!"});
    }
    for(let i = 0; i < userObj.pending.length; i++) {
        if(userObj.pending[i] == search) return response.status(400).send({error: "You already have an outgoing request to this person!"});
    }
    //Add users to their respective lists
    await User.findByIdAndUpdate(friendReq._id, { $push: { requests: userObj.username } });
    await User.findByIdAndUpdate(id, { $push: { pending: friendReq.username } });
    return response.status(200).send({error: ""});
});

//Accept or reject a friend request, either way, remove the request from both sides
//Incoming: user's object _id, username of the request sender, 1 to accept or 0 to reject
//Outgoing: status 200/error will be empty
router.put("/processRequest", async (request, response) => {
    const id = request.body.id;
    const requester = request.body.requester;
    const accept = request.body.accept;
    if(id == null || id == undefined || id == "" || accept == null || accept == undefined || requester == null || requester == undefined) return response.status(400).send({
        error: "Empty request."});
    const userObj = await User.findById(id);
    const newFriendObj = await User.findOne({username: requester});
    const newFriend = newFriendObj._id;
    //Check to see if the requester still exists
    if(newFriendObj == null || newFriendObj == undefined) {
        return response.status(404).send({error: "This user doesn't exist anymore!"});
    }
    //Remove the requester from your requests list, and remove the user from the requester's pending list
    await User.findByIdAndUpdate(id, { $pull: { requests: requester } });
    await User.findByIdAndUpdate(newFriend, { $pull: { pending: userObj.username } });
    if(accept) {
        //Add both users to their respective friend lists
        await User.findByIdAndUpdate(id, { $push: { friends: newFriend } });
        await User.findByIdAndUpdate(newFriend, { $push: { friends: id } });
    }
    return response.status(200).send({error: ""});
});

//Remove a friend from the user's friends list and remove the user from their ex-friend's friends list
//Incoming: user's object _id, object _id of the friend to be removed
//Outgoing: user's new friends list, error: friend removed
router.put("/removeFriend", async (request, response) => {
    const id = request.body.id;
    const removed = request.body.removed;
    if(id == null || id == undefined || id == "" || removed == null || removed == undefined || removed == "") return response.status(400).send({error: "Empty request."});
    const userObj = await User.findById(id);
    try {
        const removedObj = await User.findById(removed);
        //Check if the user is actually friends with this person
        if(!userObj.friends.includes(removed)) return response.status(400).send({error: "You are not currently friends with this person!"});
        //Remove the chosen person from the user's friends list
        await User.findByIdAndUpdate(id, {$pull: {friends: removed}});
        //Remove the user from the chosen person's friends list
        await User.findByIdAndUpdate(removed, {$pull: {friends: id}});
        return response.status(200).send({error: removedObj.username + " removed from friends"});
    }
    catch(error) {
        return response.status(404).send({error: "Friend to be removed does not exist"});
    }
});

//Retrieve documents for all friends on a user's friend list
//Incoming: user's object _id
//Outgoing: array of friend documents called friends
router.post("/get", async (request, response) => {
    const id = request.body.id;
    if(id == null || id == undefined || id == "") return response.status(400).send({error: "Empty request."});
    const userObj = await User.findById(id);
    //our return array
    let _ret = new Array();
    for(let i = 0; i < userObj.friends.length; i++) {
        _ret.push(await User.findById(userObj.friends[i]));
    }
    return response.status(200).send({friends: _ret});
});

//Find all friend documents that match a given query
//Incoming: user's object _id, username/firstName/lastName to search for
//Outgoing: array of matching friend documents called friends
router.post("/search", async (request, response) => {
    const {id, search} = request.body;
    if(id == null || id == undefined || id == "" || search == null || search == undefined) return response.status(400).send({error: "Empty request."});
    userObj = await User.findById(id);
    let _ret = new Array();
    const regex = new RegExp("^" + search + "[\w]*", "i");
    for(let i = 0; i < userObj.friends.length; i++) {
        //Flag for when our search comes up empty for this id
        let notFound = 0;
        //We $and with the id so that we only get users who are on the user's friend list
        let result = await User.findOne( {$and: [{_id: userObj.friends[i]}, { $or: [{ username: {$regex: regex} }, { firstName : {$regex: regex} }, { lastName : {$regex: regex}}] }] } )
        .catch(err => {
            notFound = 1;
        });
        if(result == undefined | result == null)
            continue;
        if(!notFound)
            _ret.push(result);
    }
    return response.status(200).send({friends: _ret});
});

module.exports = router;
