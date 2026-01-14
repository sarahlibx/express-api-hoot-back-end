// controllers/hoots.js

const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Hoot = require("../models/hoot.js");
const router = express.Router();

// POST /hoots
router.post('/', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        // check that author field is being populated with username, not just ID
        hoot._doc.author = req.user;
        res.status(201).json(hoot);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

module.exports = router;
