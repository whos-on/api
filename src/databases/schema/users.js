const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  password: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  email: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  firstName: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  lastName: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  location: [],
  friends: [
    { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  ],
  pending: [
    { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  ],
  requests: [
    { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  ],
});

module.exports = mongoose.model("users", UserSchema);
