require("dotenv").config()

const express = require("express")
const userRoute = require("./routes/user")
const friendRoute = require("./routes/friend")
const chatRoute = require("./routes/chat")

const app = express()

app.use(express.json())

app.use("/api/user", userRoute)
app.use("/api/friend", friendRoute)
app.use("/api/chat", chatRoute)

module.exports = app
