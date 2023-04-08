const User = require("../databases/schema/users");

async function addFriendController(request, response) {
  const { id, search } = request.body;
  const userObj = await User.findById(id);
  //search by username for the requestee, if not found, return an error
  const friendReq = await User.findOne({ username: search });
  if (!friendReq) {
    return response
      .status(404)
      .send({ error: "No user exists for that username!" });
  }
  await User.findByIdAndUpdate(friendReq._id, {
    $push: { requests: userObj.username },
  });
  await User.findByIdAndUpdate(id, { $push: { pending: friendReq.username } });
  return response.status(200).send({ error: "" });
}

module.exports = { addFriendController };
