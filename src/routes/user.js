const express = require("express");
const User = require("../databases/schema/users");
const router = express.Router();
const { hashPassword, comparePassword } = require("../utils/helpers");

//Handle logins:
//Incoming: email/password 
//Outgoing: response code or username/firstName/lastName
router.post("/login", async (request, response) => {
  const { email, password } = request.body;
  //Check for empty request
  if (!email || !password) 
    return response.sendStatus(400);
  
  //Authenticate the user
  const userDB = await User.findOne({ email });
  if (!userDB) 
    return response.sendStatus(401);
  const isValid = comparePassword(password, userDB.password);
  if (isValid) {
    console.log("Authenticated Successfully!");
    //request.session.user = userDB;
    return response.status(200).send({id: userDB._id, username: userDB.username, 
      firstName: userDB.firstName, lastName: userDB.lastName});
  } 
  else {
    //Incorrect password
    console.log("Failed to Authenticate");
    return response.sendStatus(401);
  }
});

//Register a new user and add them to the database
//Incoming: email, password, username, firstName, lastName
//Outgoing: response code
router.post("/register", async (request, response) => {
  const { email, password, username, firstName, lastName } = request.body;
  //Search for an existing user, return error 400 if one exists
  const userDB = await User.findOne({ $or: [{ email }, { username }] });
  if (userDB) {
    response.status(400).send({ error: "User already exists!" });
  } 
  else {
    //User does not exist, successfully create a new one
    const password = hashPassword(request.body.password);
    console.log(password);
    const newUser = await User.create({ username, password, email, 
      firstName, lastName });
    response.sendStatus(201);
  }
});

//Refresh a users status and location, and return all friend related lists to check for changes
//Incoming: user's object _id, current status, current location
//Outgoing: user's friend list, pending list, and requests list
router.put("/refresh", async (request, response) => {
    const id = request.body.id;
    const stat = request.body.userStatus;
    const loc = request.body.location;
    userObj = await User.findById(id);

    //Update the status and location
    await User.findByIdAndUpdate(id, {$set: {"stat.userStatus" : stat, "stat.lastUpdated": Date.now(), 
    "location.longitude" : loc.longitude, "location.latitude": loc.latitude} });

    return response.status(200).send({friends: userObj.friends, pending: userObj.pending, requests: userObj.requests});
});

module.exports = router;
