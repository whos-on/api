const express = require('express');
const Chat = require('../databases/schema/chats');
const router = express.Router();

//Work in Progress...
//Incoming: creator, people involved, a starting message
//Outgoing: a chat is created and added to all the involved users' chat arrays, empty error/status 201
router.post('/create', (request, response) => {
    const creator = request.creator;
    const people = request.people;
    const message = request.message;
    response.status(201).send({error: NULL});
})