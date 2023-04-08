const User = require("../databases/schema/users");
const { hashPassword, comparePassword } = require("../utils/helpers");

async function registerController(request, response) {
  const { email, password, username, firstName, lastName } = request.body;
  //Search for an existing user, return error 400 if one exists
  const userDB = await User.findOne({ $or: [{ email }, { username }] });
  if (userDB) {
    response.status(401);
    response.send({ error: "User already exists!" });
  } else {
    //User does not exist, successfully create a new one
    const password = hashPassword(request.body.password);
    const newUser = await User.create({
      username,
      password,
      email,
      firstName,
      lastName,
    });
    response.sendStatus(201);
  }
}

module.exports = { registerController };
