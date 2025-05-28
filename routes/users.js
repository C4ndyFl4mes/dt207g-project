const express = require('express');
const { authorize } = require('../utilities/token');
const { editUser, deleteUser, getUsers, getProfile } = require('../utilities/user');
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
router.put("/:id", authorize(['user', 'admin', 'root']), editUserValidationRules(), validate, (req, res) => {
    const target = {
        id: req.params.id,
        firstname: req.body.firstname,
        lastname: req.body.lastname
    };
    editUser(res, req.user, target);
});

// Raderar en användare.
router.delete("/:id", authorize(['user', 'admin', 'root']), (req, res) => {
    deleteUser(res, req.user, req.params.id);
});

module.exports = router;