const request = require("supertest");
const app = require("../app");

describe("Testing add friend?", () => {
    beforeAll(() => {
        mongoDB.connect();
    });

    afterAll((done) => {
        mongoDB.disconnect(done);
    });
    test("Adding friend", done => {
        request(app)
        .put("/api/friend/addFriend")
        .then(response => {
            expect(response.statusCode).toBe(200);
            done();
        });
    });
});