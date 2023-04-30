require("dotenv").config()
const supertest = require("supertest")
const app = require("../src/app")
const mongoose = require("mongoose")

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

let idA = null, idB = null

beforeEach(async () => {
    await supertest(app).post("/api/user/register").send({
        username: "test1",
        password: "password123",
        email: "test1@gmail.com",
        firstName: "test1",
        lastName: "test1",
    })

    idA = (await supertest(app).post("/api/user/login").send({
        email: "test1@gmail.com",
        password: "password123",
    })).body.id

    await supertest(app).post("/api/user/register").send({
        username: "test2",
        password: "password123",
        email: "test2@gmail.com",
        firstName: "test2",
        lastName: "test2",
    })

    idB = (await supertest(app).post("/api/user/login").send({
        email: "test2@gmail.com",
        password: "password123",
    })).body.id
})

afterEach(async () => {
    idA = null
    idB = null
})

describe("PUT /api/friend/addfriend", () => {
    it("200 on success", async () => {
        const res = await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        expect(res.status).toBe(200)
    })

    it("400 on invalid id", async () => {
        const res = await supertest(app).put("/api/friend/addfriend").send({
            id: "",
            search: "test2",
        })

        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty("error", "Empty request.")
    })

    it("400 on invalid search", async () => {
        const res = await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "",
        })

        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty("error", "Empty request.")
    })

    it("404 when user does not exist", async () => {
        const res = await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test3",
        })

        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty("error", "No user exists for that username!")
    })

    it("400 when already friends", async () => {
        await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        await supertest(app).put("/api/friend/processrequest").send({
            id: idB,
            requester: "test1",
            accept: true,
        })

        const res = await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty("error", "You are already friends with this person!")
    })

    it("400 on duplicate outgoing request", async () => {
        await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        const res = await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty("error", "You already have an outgoing request to this person!")
    })
})

describe("PUT /api/friend/processrequest", () => {
    it("200 on success (accept)", async () => {
        await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        const res = await supertest(app).put("/api/friend/processrequest").send({
            id: idB,
            requester: "test1",
            accept: true,
        })

        expect(res.status).toBe(200)
    })

    it("200 on success (decline)", async () => {
        await supertest(app).put("/api/friend/addfriend").send({
            id: idA,
            search: "test2",
        })

        const res = await supertest(app).put("/api/friend/processrequest").send({
            id: idB,
            requester: "test1",
            accept: false,
        })

        expect(res.status).toBe(200)
    })

    it("400 on invalid id", async () => {
        const res = await supertest(app).put("/api/friend/processrequest").send({
            id: "",
            requester: "test1",
            accept: true,
        })

        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty("error", "Empty request.")
    })
})
