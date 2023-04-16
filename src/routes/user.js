const express = require("express")
const { loginController } = require("../controllers/login")
const { registerController } = require("../controllers/register")
const User = require("../databases/schema/users")
const router = express.Router()
const { hashPassword, comparePassword } = require("../utils/helpers")

//Handle logins:
//Incoming: email/password
//Outgoing: response code or username/firstName/lastName
router.post("/login", loginController)

//Register a new user and add them to the database
//Incoming: email, password, username, firstName, lastName
//Outgoing: response code
router.post("/register", registerController)

//Refresh a users status and location, and return all friend related lists to check for changes
//Incoming: user's object _id, current status, current location
//Outgoing: user's friend list, pending list, and requests list
router.put("/refresh", async (request, response) => {
  const id = request.body.id
  if (id == null || id == undefined || id == "") return response.status(400).send({ error: "No id was sent..." })
  const stat = request.body.userStatus
  const loc = request.body.location
  userObj = await User.findById(id)

  //Update the status and location
  await User.findByIdAndUpdate(id, {
    $set: {
      "stat.userStatus": stat, "stat.lastUpdated": Date.now(),
      "location.longitude": loc.longitude, "location.latitude": loc.latitude
    }
  })

  return response.status(200).send({ friends: userObj.friends, pending: userObj.pending, requests: userObj.requests })
})

module.exports = router
