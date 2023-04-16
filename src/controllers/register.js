const User = require("../databases/schema/users")
const { hashPassword, comparePassword } = require("../utils/helpers")

async function registerController(request, response) {
  const { email, password, username, firstName, lastName } = request.body

  //Check for empty request items, and ensure email and password are formatted properly
  const emailRegex = /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i
  const passRegex = /^(?=.*\d)(?=.*[a-z]).{8,24}$/
  if (email == null || email == undefined || !emailRegex.test(email)) return response.status(400).send({ error: "Invalid email! Check for @ symbol or extra dots." })
  if (password == null || password == undefined || !passRegex.test(password)) return response.status(400).send({
    error: "Invalid password! Passwords must be at least 8 characters and contain one lowercase letter and one number."
  })
  if (username == null || username == undefined || username == "") return response.status(400).send({ error: "Please enter a username!" })
  if (firstName == null || firstName == undefined || firstName == "") return response.status(400).send({ error: "Please enter a firstName!" })
  if (lastName == null || lastName == undefined || lastName == "") return response.status(400).send({ error: "Please enter a lastName!" })

  //Search for an existing user, return error 400 if one exists
  const userDB = await User.findOne({ username: username })
  if (userDB) {
    return response.status(400).send({ error: "Username is taken!" })
  }
  const emailDB = await User.findOne({ email: email })
  if (emailDB) {
    return response.status(400).send({ error: "Email currently in use!" })
  } else {
    //User does not exist, successfully create a new one
    const password = hashPassword(request.body.password)
    console.log(password)
    const newUser = await User.create({
      username,
      password,
      email,
      firstName,
      lastName,
    })
    return response.status(201).send({ error: null })
  }
}

module.exports = { registerController }
