const mongoose = require("mongoose")

module.exports = () => {
    if (process.env.NODE_ENV == "production") {
        console.log("Cannot run tests in production mode")
        process.exit(1)
    }

    beforeEach(async () => {
        return await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
    })

    afterEach(async () => {
        await mongoose.connection.db.dropCollection("users")
        return await mongoose.connection.close()
    })
}
