const express = require('express');
const { authorize } = require('../utilities/token');
const { editUser, deleteUser } = require('../utilities/user');
const { editUserValidationRules, validate } = require('../utilities/validation');
const router = express.Router();

router.put("/:id", authorize(['user', 'admin', 'root']), editUserValidationRules(), validate, (req, res) => {
    const target = {
        id: req.params.id,
        firstname: req.body.firstname,
        lastname: req.body.lastname
    };
    editUser(res, req.user, target);
});

router.delete("/:id", authorize(['user', 'admin', 'root']), (req, res) => {
    deleteUser(res, req.user, req.params.id);
});

module.exports = router;