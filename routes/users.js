const express = require('express');
const { authorize } = require('../utilities/token');
const { editUser, deleteUser, getUsers, getProfile, isUserLoggedIn } = require('../utilities/user');
const { editUserValidationRules, validate } = require('../utilities/validation');
const router = express.Router();

// Hämtar användare med query parametrarna roles, firstname, lastname, page och limit.
router.get("/", authorize(['admin', 'root']), (req, res) => {
    getUsers(res, req.query);
});

// Hämtar en profil, user kan endast se sin egen medan admin och root kan se andras också bereonde på id i query.
router.get("/profile", authorize(['user', 'admin', 'root']), (req, res) => {
    getProfile(res, req.user, req.query);
});

// Ändrar en användare.
router.put("/user/:id", authorize(['user', 'admin', 'root']), editUserValidationRules(), validate, (req, res) => {
    editUser(res, req.user, req.params.id, req.body);
});

// Raderar en användare.
router.delete("/user/:id", authorize(['user', 'admin', 'root']), (req, res) => {
    deleteUser(res, req.user, req.params.id);
});

// Kollar om en användare är inloggad.
router.get("/check/:id", authorize(['user', 'admin', 'root']), (req, res) => {
    isUserLoggedIn(res, req.params.id);
});

module.exports = router;