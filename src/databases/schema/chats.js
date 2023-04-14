const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema( {
    sender: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    contents: mongoose.SchemaTypes.String,
    timestamp: {
        type: Date,
        required: true
    }
});

const chatSchema = new mongoose.Schema( {
    people: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    messages: [messageSchema],
    lastChecked: {
        type: [Date],
        required: true
    }
});

module.exports = mongoose.model("chats", chatSchema);