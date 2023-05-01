require("dotenv").config()
const supertest = require("supertest")
const app = require("../src/app")
const mongoose = require("mongoose")
const jestpreflight = require("./jestpreflight")

jestpreflight()

describe("POST /api/user/register", () => {
    test("201 on success", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(201)
    })

    test("400 on invalid email", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "//0te@.//.@@@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Invalid email! Check for @ symbol or extra dots.")
    })

    test("400 on invalid password", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "A",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Invalid password! Passwords must be at least 8 characters and contain one lowercase letter and one number.")
    })

    test("400 on empty username", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Please enter a username!")
    })

    test("400 on empty firstName", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Please enter a firstName!")
    })

    test("400 on empty lastName", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Please enter a lastName!")
    })

    test("400 on taken username", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(201)

        const res2 = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res2.statusCode).toBe(400)
        expect(res2.body)
            .toHaveProperty("error", "Username is taken!")
    })

    test("400 on taken email", async () => {
        const res = await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res.statusCode).toBe(201)

        const res2 = await supertest(app).post("/api/user/register").send({
            username: "test2",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })

        expect(res2.statusCode).toBe(400)
        expect(res2.body)
            .toHaveProperty("error", "Email currently in use!")
    })
})

describe("POST /api/user/login", () => {
    beforeEach(async () => {
        return await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })
    })

    test("200 on success", async () => {
        const res = await supertest(app).post("/api/user/login").send({
            email: "test@gmail.com",
            password: "password123",
        })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("id")
        expect(res.body).toHaveProperty("username", "test")
        expect(res.body).toHaveProperty("firstName", "First")
        expect(res.body).toHaveProperty("lastName", "Last")
    })

    test("400 on invalid email", async () => {
        const res = await supertest(app).post("/api/user/login").send({
            email: "",
            password: "password123",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Empty request was sent!")
    })

    test("400 on invalid password", async () => {
        const res = await supertest(app).post("/api/user/login").send({
            email: "test@gmail.com",
            password: "",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "Empty request was sent!")
    })

    test("401 on incorrect email", async () => {
        const res = await supertest(app).post("/api/user/login").send({
            email: "testing@gmail.net",
            password: "password123",
        })
    })

    test("401 on incorrect password", async () => {
        const res = await supertest(app).post("/api/user/login").send({
            email: "test@gmail.com",
            password: "password1234",
        })

        expect(res.statusCode).toBe(401)
        expect(res.body)
            .toHaveProperty("error", "Incorrect login information!")
    })
})

describe("POST /api/user/info", () => {
    beforeEach(async () => {
        return await supertest(app).post("/api/user/register").send({
            username: "test",
            password: "password123",
            email: "test@gmail.com",
            firstName: "First",
            lastName: "Last",
        })
    })

    test("200 on success (username)", async () => {
        const res = await supertest(app).post("/api/user/info").send({
            username: "test",
        })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("id")
        expect(res.body).toHaveProperty("username", "test")
        expect(res.body).toHaveProperty("firstName", "First")
        expect(res.body).toHaveProperty("lastName", "Last")
        expect(res.body).toHaveProperty("status")
        expect(res.body).toHaveProperty("lastUpdated")
    })

    test("400 on invalid username", async () => {
        const res = await supertest(app).post("/api/user/info").send({
            username: "",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "No id or username was sent...")
    })

    test("404 on invalid id", async () => {
        const res = await supertest(app).post("/api/user/info").send({
            id: "",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "No id or username was sent...")
    })

    test("400 on non-existent username", async () => {
        const res = await supertest(app).post("/api/user/info").send({
            username: "test2",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "No user found...")
    })
})

describe("POST /api/user/search", () => {
    beforeEach(async () => {
        // Hacky way to create users asynchronously
        for await (let i of [...Array(5).keys()]) {
            await supertest(app).post("/api/user/register").send({
                username: `test${ i }`,
                password: "password123",
                email: `test${ i }@gmail.com`,
                firstName: `First${ i }`,
                lastName: `Last${ i }`,
            })
        }
        for await (let i of [...Array(2).keys()]) {
            await supertest(app).post("/api/user/register").send({
                username: `ababab${ i }`,
                password: "password123",
                email: `valid_email${ i }@gmail.com`,
                firstName: `Random${ i }`,
                lastName: `Last${ i }`,
            })
        }
        await supertest(app).post("/api/user/register").send({
            username: `NotSearchedFor`,
            password: "password123",
            email: `notsearchedfor@gmail.com`,
            firstName: `NotSearchedFor`,
            lastName: `NotSearchedFor`,
        })
    })

    test("200 on success (username)", async () => {
        const res = await supertest(app).post("/api/user/search").send({
            query: "ababab",
        })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(2)
        expect(res.body[0]).toHaveProperty("id")
        expect(res.body[0]).toHaveProperty("username")
        expect(res.body[0]).toHaveProperty("firstName")
        expect(res.body[0]).toHaveProperty("lastName")
        expect(res.body[0]).toHaveProperty("status")
        expect(res.body[0]).toHaveProperty("lastUpdated")
    })

    test("200 on success (firstName)", async () => {
        const res = await supertest(app).post("/api/user/search").send({
            query: "test",
        })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(5)
        expect(res.body[0]).toHaveProperty("id")
        expect(res.body[0]).toHaveProperty("username")
        expect(res.body[0]).toHaveProperty("firstName")
        expect(res.body[0]).toHaveProperty("lastName")
        expect(res.body[0]).toHaveProperty("status")
        expect(res.body[0]).toHaveProperty("lastUpdated")
    })

    test("200 on success (lastName)", async () => {
        const res = await supertest(app).post("/api/user/search").send({
            query: "Last",
        })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(7)
        expect(res.body[0]).toHaveProperty("id")
        expect(res.body[0]).toHaveProperty("username")
        expect(res.body[0]).toHaveProperty("firstName")
        expect(res.body[0]).toHaveProperty("lastName")
        expect(res.body[0]).toHaveProperty("status")
        expect(res.body[0]).toHaveProperty("lastUpdated")
    })

    test("200 on success (no results)", async () => {
        const res = await supertest(app).post("/api/user/search").send({
            query: "a valid search query but no results"
        })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(0)
    })

    test("400 on invalid query", async () => {
        const res = await supertest(app).post("/api/user/search").send({
            query: "",
        })

        expect(res.statusCode).toBe(400)
        expect(res.body)
            .toHaveProperty("error", "No query was sent...")
    })
})
