require("dotenv").config()
const supertest = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')

if (process.env.NODE_ENV == "production") {
    console.log("Cannot run tests in production mode")
    process.exit(1)
}

describe("Test the user authentication/info routes (/api/user/*)", () => {
    beforeEach(async () => {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
    })

    afterEach(async () => {
        await mongoose.connection.db.dropCollection("users")
        await mongoose.connection.close()
    })

    test("(POST /api/user/register) 201 on success", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(201)
    })
})
