const express = require("express");

// require("./src/databases");

const userRoute = require("./src/routes/user");

const friendRoute = require("./src/routes/friend");

const app = express();

// Turn on the database

// print out the method + url
app.use((req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next();
});

app.use(express.json());

app.use("/api/user", userRoute);

app.use("/api/friend", friendRoute);

module.exports = app;
