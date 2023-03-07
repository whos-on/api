const express = require("express");
const mongoose = require("mongoose");

const loginRoute = require("/routes/login");

const app = express();
const PORT = 3001;

// print out the method + url
app.use((req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next();
});

app.use("/api/login", loginRoute);

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
