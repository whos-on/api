const User = require("../databases/schema/users")

async function addFriendController(request, response) {
  const { id, search } = request.body
  if (id == null || id == undefined || id == "" || search == null || search == undefined || search == "") return response.status(400).send({ error: "Empty request." })
  const userObj = await User.findById(id)
  //search by username for the requestee, if not found, return an error
  const friendReq = await User.findOne({ username: search })
  if (friendReq == null || friendReq == undefined) {
    return response.status(404).send({ error: "No user exists for that username!" })
  }
  //Make sure that user isn't already friends with the receiver, and that they haven't already sent them a request
  for (let i = 0; i < userObj.friends.length; i++) {
    let friendObj = await User.findById(userObj.friends[i])
    if (friendObj.username == search) return response.status(400).send({ error: "You are already friends with this person!" })
  }
  for (let i = 0; i < userObj.pending.length; i++) {
    if (userObj.pending[i] == search) return response.status(400).send({ error: "You already have an outgoing request to this person!" })
  }
  //Add users to their respective lists
  await User.findByIdAndUpdate(friendReq._id, { $push: { requests: userObj.username } })
  await User.findByIdAndUpdate(id, { $push: { pending: friendReq.username } })
  return response.status(200).send({ error: "" })
}

module.exports = { addFriendController }
