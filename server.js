require("dotenv").config()

const mongoose = require("mongoose")
const app = require("./src/app")

const PORT = process.env.PORT || 3000

// print out the method + url
app.use((req, res, next) => {
    console.log(`${ req.method }:${ req.url }`)
    next()
})

// Turn on the database
mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(result => {
        //Only start listening once the database has connected
        app.listen(PORT, () => console.log(`Server is running on PORT ${ PORT }`))
    })
    .catch(err => console.log(err))

