const express = require('express');
const router = express.Router();
const { userValidationRules, validate } = require('../utilities/validation');
const { createUser } = require('../utilities/user');

router.post("/register", userValidationRules(), validate, async (req, res) => {
    createUser(res, req.body);
});

router.post("/login", async (req, res) => {
    return res.status(200).json({message: "Logga in fungerar!"});
});

module.exports = router;