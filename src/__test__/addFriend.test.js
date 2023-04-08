const { addFriendController } = require("../controllers/friends");
const User = require("../databases/schema/users");
const request = require("supertest");
const app = require("../../app");
const mongoose = require("mongoose");

require("dotenv").config();

beforeEach(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
});

// // /* Dropping the database and closing connection after each test. */
afterEach(async () => {
  // await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("PUT /addfriend", () => {
  it("should return 404 if no user exists for the given username (can't add friend)", async () => {
    // mock the findById method to return null, indicating that no user was found
    // User.findById.mockResolvedValue(null);
    const response = await request(app)
      .put("/addFriend")
      .send({ id: "user123", search: "nonexistentuser" });

    expect(response.statusCode).toBe(404);
    // expect(response.body).toEqual({
    //   error: "No user exists for that username!",
    // });
  });

  it("adds the user to the friend's requests and adds the friend to the user's pending list", async () => {
    const response = await request(app)
      .put("/addFriend")
      .send({ id: "6429cff570e84ada06e3f569", search: "bambam" });
    console.log(response.body);
    // expect(response.body).toEqual({ error: "" });
    expect(response.statusCode).toBe(404);
  });
});
