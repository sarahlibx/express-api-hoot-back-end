// /controllers/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const saltRounds = 12;

router.post('/sign-up', async (req, res) => {
    // check if username is already taken
  try {
    const userInDatabase = await User.findOne({ username: req.body.username });

    if (userInDatabase) {
        return res.status(409).json({err:'Username already exists'});
    }
    // create new user w/hashed password
    const user = await User.create({
        username: req.body.username,
        hashedPassword: bcrypt.hashSync(req.body.password, saltRounds)
    });
    // construct payload with user data
    const payload = { username: user.username, _id: user._id };

    // create the token, attach the payload
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);

    // send the token instead of the user
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/sign-in', async (req, res) => {
    try {
        // look up user in database
        const user = await User.findOne({ username: req.body.username });
        // if user doesn't exist, return 401
        if (!user) {
            return res.status(401).json({ err: 'Invalid credentials!' });
        }
        // Check if the password is correct using bcrypt
        const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.hashedPassword
        );
        // If the password is incorrect, return a 401 status code with a message
        if (!isPasswordCorrect) {
            return res.status(401).json({ err: 'Invalid credentials.' });
        }

        // Construct the payload
        const payload = { username: user.username, _id: user._id };

        // Create the token, attaching the payload
        const token = jwt.sign({ payload }, process.env.JWT_SECRET);

        // Send the token instead of the message
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
})

module.exports = router;
