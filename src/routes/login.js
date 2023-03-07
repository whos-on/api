const { Router, response } = require("express");
const User = require("../databases/schema/User");
const router = Router();
const { hashPassword, comparePassword } = require("../utils/helpers");

router.post("/login", async (request, response) => {
  const { email, passsword } = request.body;
  if (!email || !password) return response.send(400);
  const userDB = await User.findOne({ email });
  if (!userDB) return response.send(401);
  const isValid = comparePassword(password, userDB.password);
  if (isValid) {
    console.log("Authenticated Successfully!");
    request.session.user = userDB;
    return response.send(200);
  } else {
    console.log("Failed to Authenticate");
    return response.send(401);
  }
});

router.post("/register", async (request, response) => {
  const { username, password, email } = request.body;
  const userDB = await User.findOne({ $or: [{ username }, { email }] });
  if (userDB) {
    response.status(400).send({ msg: "User already exists!" });
  } else {
    const password = hashPassword(request.body.password);
    console.log(password);
    const newUser = await User.create({ username, password, email });
    response.send(201);
  }
});
module.exports = router;
