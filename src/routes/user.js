const express = require("express")
const User = require("../databases/schema/users")
const router = express.Router()
const { hashPassword, comparePassword } = require("../utils/helpers")
const crypto = require("crypto")

//Handle logins:
//Incoming: email/password
//Outgoing: response code or username/firstName/lastName
router.post("/login", async (request, response) => {
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
})

//Register a new user and add them to the database
//Incoming: email, password, username, firstName, lastName
//Outgoing: response code
router.post("/register", async (request, response) => {
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
            verificationCode: crypto.randomInt(100000, 999999)
        })
        return response.status(201).send({ error: null })
    }
})

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

// Get info for a specific user by their id or username.
// Incoming: user's object _id OR username
// Outgoing: user's object _id, user's username, firstName, lastName, status, lastUpdated
router.post("/info", async (req, res) => {
    const id = req.body?.id || null
    const username = req.body?.username || null

    if (!id && !username) return res.status(400).send({ error: "No id or username was sent..." })

    let query = await (id ? User.findById(id) : User.findOne({ username: username })) || null
    if (!query) return res.status(400).send({ error: "No user found..." })

    return res.status(200).send({
        id: query._id,
        username: query.username,
        firstName: query.firstName,
        lastName: query.lastName,
        status: query.stat.userStatus,
        lastUpdated: query.stat.lastUpdated
    })
})

// Search for a user by their username, first name, or last name.
// Incoming: search query
// Outgoing: array of user objects with _id, username, firstName, lastName, status, lastUpdated
router.post("/search", async (req, res) => {
    const q = req.body?.query || null
    const limit = Math.min(req.body?.limit || 10, 100)

    if (!q) return res.status(400).send({ error: "No query was sent..." })

    let query = await User.find({
        $or: [
            { username: { $regex: q, $options: "i" } },
            { firstName: { $regex: q, $options: "i" } },
            { lastName: { $regex: q, $options: "i" } }
        ]
    }).limit(limit).select("_id username firstName lastName stat.userStatus stat.lastUpdated")


    return res.status(200).send(query.map((
        { _id: id, username, firstName, lastName, stat: { userStatus: status, lastUpdated } }) => {
        return { id, username, firstName, lastName, status, lastUpdated }
    }) || [])
})

// Verify a user's email address
// Incoming: user's object _id, verification code (6 digit number)
// Outgoing: nothing
router.post("/verify", async (req, res) => {
    const id = req.body?.id || null
    const code = req.body?.code || null

    // No id or code provided
    if (!id)
        return res.status(400).send({ error: "Invalid id provided" })
    if (!code || code < 100000 || code > 999999)
        return res.status(400).send({ error: "Invalid code provided" })

    let user = await User.findById(id)
    if (!user)
        return res.status(400).send({ error: `No user found with id ${ id }` })

    // Check if the user is already verified or if the code is incorrect
    if (!user.verificationCode)
        return res.status(401).send({ error: "User is already verified" })

    // Check if the code is correct
    if (user.verificationCode != code)
        return res.status(401).send({ error: "Invalid code provided" })

    // Update the user's verification
    user.verificationCode = null
    await user.save()

    return res.status(200).send({ error: null })
})

module.exports = router
