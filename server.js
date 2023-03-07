const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const userRoute = require("./src/routes/user");

const app = express();
const PORT = process.env.PORT || 3000;

//Turn on the database
mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => {
      //Only start listening once the database has connected
      app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
    })
    .catch((err) => console.log(err));

// print out the method + url
app.use((req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next();
});

app.use(express.json());

app.use("/api/user", userRoute);


