const { registerController } = require("../controllers/register");
const User = require("../databases/schema/users");
const { hashPassword } = require("../utils/helpers");

jest.mock("../utils/helpers", () => ({
  hashPassword: jest.fn(() => "hash password"),
}));
jest.mock("../databases/schema/users");

const request = {
  body: {
    email: "fake_email",
    password: "fake_password",
    username: "fakeusername",
    firstName: "John",
    lastName: "Doe",
  },
};

const response = {
  sendStatus: jest.fn((x) => x),
  status: jest.fn((x) => x),
  send: jest.fn((x) => x),
};
const error = {
  error: "User already exists!",
};
describe("POST /register", () => {
  it("responds with status 201 if register succesfully", async () => {
    User.findOne.mockResolvedValueOnce(undefined);
    User.create.mockResolvedValueOnce({
      email: "fake_email",
      password: "fake_password",
      username: "fakeusername",
      firstName: "John",
      lastName: "Doe",
    });
    await registerController(request, response);
    expect(hashPassword).toHaveBeenCalledWith("fake_password");
    expect(User.create).toHaveBeenCalledWith({
      email: "fake_email",
      password: "hash password",
      username: "fakeusername",
      firstName: "John",
      lastName: "Doe",
    });
    expect(response.sendStatus).toHaveBeenCalledWith(201);
  });

  it("responds with status 401 if user already exists", async () => {
    User.findOne.mockImplementationOnce(() => ({
      id: 1,
      email: "email",
      password: "password",
    }));

    await registerController(request, response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledTimes(1);
  });
});
