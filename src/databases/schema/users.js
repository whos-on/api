const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  stat: {
    status: {type: String},
    lastUpdated: {type: Date}
  },
  location: {
    longitude: {type: String},
    latitude: {type: String}
  },
  friends: [Schema.Types.ObjectId],
  pending: [String],
  requests: [String],
});

module.exports = mongoose.model("users", UserSchema);
