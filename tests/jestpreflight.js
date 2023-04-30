const mongoose = require("mongoose")
const { MongoMemoryServer } = require("mongodb-memory-server")

module.exports = () => {
    let mongoServer, mongoUri

    if (process.env.NODE_ENV == "production") {
        console.log("Cannot run tests in production mode")
        process.exit(1)
    }

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create()
        await mongoose.connect(mongoUri = mongoServer.getUri(), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        return await mongoose.connection.db.dropDatabase()
    })

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase()
        await mongoose.connection.close()
        return await mongoServer.stop()
    })
}
