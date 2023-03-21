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
    lowercase: true
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
    userStatus: {
      type: String,
      default: "Offline"
    },
    lastUpdated: {
      type: Date,
      default: () => Date.now(),
    }
  },
  location: {
    longitude: String,
    latitude: String
  },
  friends: [mongoose.SchemaTypes.ObjectId],
  pending: [String],
  requests: [String],
});

module.exports = mongoose.model("users", UserSchema);
