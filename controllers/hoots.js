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

// GET /hoots (A user needs to be logged in to view a list of hoots, so be sure to include the verifyToken middleware)
router.get('/', verifyToken, async(req, res) => {
    try {
        const hoots = await Hoot.find({})
        .populate('author')
        .sort({ createdAt: 'desc' });
    res.status(200).json(hoots);

    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// GET /:hootId
router.get("/:hootId", verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId).populate(['author', 'comments.author']);
    res.status(200).json(hoot);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT /hoots/:hootId
router.put('/:hootId', verifyToken, async(req, res) => {
    try {
        // find the hoot
        const hoot = await Hoot.findById(req.params.hootId);
        // check if hoot exists
        if (!hoot) {
            return res.status(404).json({ err: 'Hoot not found.' });
        }
        // check permissions
        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).send('Access denied!');
        }
        // update hoot
        const updatedHoot = await Hoot.findByIdAndUpdate(
            req.params.hootId,
            req.body, 
            { new: true }
        );
        // append user to the author property
        updatedHoot._doc.author = req.user;
        // issue json response
        res.status(200).json(updatedHoot);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// DELETE /hoots/:hootId
router.delete("/:hootId", verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);

    if (!hoot) {
        return res.status(404).json({ err: 'Hoot not found.' });
    }

    if (!hoot.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
    res.status(200).json(deletedHoot);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST /hoots/:hootId/comments
router.post('/:hootId/comments', verifyToken, async(req, res) => {
    try {
        // author of comment
        req.body.author = req.user._id;
        // find hoot to add comment to
        const hoot = await Hoot.findById(req.params.hootId);

        if (!hoot) {
            return res.status(404).json({ err: 'Hoot not found.' });
        }
        // push comments into hoot via the form
        hoot.comments.push(req.body);
        await hoot.save();

        // find newly created comment from array of comments
        const newComment = hoot.comments[hoot.comments.length - 1];
        newComment._doc.author = req.user;

        // respond with the newComment
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// PUT /hoots/:hootId/comments/:commentId
router.put("/:hootId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    const comment = hoot.comments.id(req.params.commentId);

    // ensures the current user is the author of the comment
    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    comment.text = req.body.text;
    await hoot.save();
    res.status(200).json({ message: "Comment updated successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// DELETE /hoots/:hootId/comments/:commentId
router.delete("/:hootId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    const comment = hoot.comments.id(req.params.commentId);

    // ensures the current user is the author of the comment
    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    hoot.comments.remove({ _id: req.params.commentId });
    await hoot.save();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
