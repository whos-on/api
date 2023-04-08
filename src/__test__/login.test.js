const { loginController } = require("../controllers/login");
const User = require("../databases/schema/users");
// const { hashPassword, comparePassword } = require("../utils/helpers");
const route = require("../routes/user");
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
require("dotenv").config();

/* Connecting to the database before each test. */
beforeEach(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
});

// // /* Dropping the database and closing connection after each test. */
afterEach(async () => {
  // await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("GET /login", () => {
  it("responds with status 200 if login succesfully", async () => {
    const response = await request(app)
      .post("/api/user/login")
      .send({ email: "micahel1@gmail.com", password: "1234" });
    // expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      id: "6429cff570e84ada06e3f569",
      username: "Michael02",
      firstName: "Michael",
      lastName: "Tran",
    });
    expect(response.statusCode).toBe(200);
  });

  it("responds with status 401 and an error message if the username or password is incorrect", async () => {
    const response = await request(app)
      .post("/api/user/login")
      .send({ email: "micahel1@gmail.com", password: "wrongpassword" });
    expect(response.statusCode).toBe(401);
  });
});
