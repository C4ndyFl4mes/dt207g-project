const express = require('express');
const router = express.Router();

router.post("/register", async (req, res) => {
    return res.status(201).json({message: "Registrering fungerar!"});
});

router.post("/login", async (req, res) => {
    return res.status(200).json({message: "Logga in fungerar!"});
});

module.exports = router;