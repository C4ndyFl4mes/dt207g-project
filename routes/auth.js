const express = require('express');
const router = express.Router();
const { userValidationRules, validate, adminValidationRules } = require('../utilities/validation');
const { createUser, loginUser } = require('../utilities/user');
const { authorize } = require('../utilities/token');

router.post("/register", userValidationRules(), validate, async (req, res) => {
    createUser(res, req.body);
});

router.post("/login", async (req, res) => {
    loginUser(res, req.body);
});

// För att skapa admins. Endast root kan göra det.
router.post("/root/register", authorize(['root']), adminValidationRules(), validate, (req, res) => {
    createUser(res, req.body, req.user);
});



module.exports = router;