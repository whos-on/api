const User = require("../databases/schema/users")
const { hashPassword, comparePassword } = require("../utils/helpers")

async function loginController(request, response) {
  const { email, password } = request.body
  //Check for empty request
  if (email == null || email == undefined || email == "" ||
    password == null || password == undefined || password == "") return response.status(400).send({ error: "Empty request was sent!" })

  //Authenticate the user
  const userDB = await User.findOne({ email })
  if (userDB == null || userDB == undefined) return response.status(401).send({ error: "Incorrect login information!" })
  const isValid = comparePassword(password, userDB.password)
  if (isValid) {
    console.log("Authenticated Successfully!")
    //request.session.user = userDB;
    return response
      .status(200)
      .send({
        id: userDB._id,
        username: userDB.username,
        firstName: userDB.firstName,
        lastName: userDB.lastName,
      })
  } else {
    //Incorrect password
    console.log("Failed to Authenticate")
    return response.status(401).send({ error: "Incorrect login information!" })
  }
}

module.exports = { loginController }
