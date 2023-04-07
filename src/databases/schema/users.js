const mongoose = require("mongoose")

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
    lowercase: true
  },
  firstName: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  lastName: {
    type: mongoose.SchemaTypes.String,
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
})

module.exports = mongoose.model("users", UserSchema)
