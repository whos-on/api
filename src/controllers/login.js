const User = require("../databases/schema/users");
const { hashPassword, comparePassword } = require("../utils/helpers");

async function loginController(request, response) {
  const { email, password } = request.body;
  //Check for empty request
  if (!email || !password) return response.sendStatus(400);

  //Authenticate the user
  const userDB = await User.findOne({ email });
  if (!userDB) {
    return response.sendStatus(401);
  }
  const isValid = comparePassword(password, userDB.password);
  if (isValid) {
    // console.log("Authenticated Successfully!");
    //request.session.user = userDB;
    return response.status(200).json({
      id: userDB._id,
      username: userDB.username,
      firstName: userDB.firstName,
      lastName: userDB.lastName,
    });
  } else {
    //Incorrect password
    // console.log("Failed to Authenticate");
    return response.sendStatus(401);
  }
}

module.exports = { loginController };
