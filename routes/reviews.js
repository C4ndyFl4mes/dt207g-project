const express = require('express');
const { reviewValidationRules, validate } = require('../utilities/validation');
const { createReview, editReview, deleteReview, alreadyPostedReviewOnProduct } = require('../utilities/review');
const { authorize } = require('../utilities/token');
const router = express.Router();

// Lägger till en recension till en produkt (:id).
router.post("/review/:id", authorize(['user', 'admin', 'root']), reviewValidationRules(), validate, (req, res) => {
    createReview(res, req.body, req.user, req.params.id);
});

// Ändrar en recension (:id).
router.put("/review/:id", authorize(['user', 'admin', 'root']), reviewValidationRules(), validate, (req, res) => {
    editReview(res, req.body, req.user, req.params.id);
});

// Raderar en recension (:id).
router.delete("/review/:id", authorize(['user', 'admin', 'root']), (req, res) => {
    deleteReview(res, req.user, req.params.id);
});

// Kollar om en användare redan lagt till en recension till en produkt (:id).
router.get("/check/:id", authorize(['user', 'admin', 'root']), (req, res) => {
    alreadyPostedReviewOnProduct(res, req.params.id, req.user);
});

module.exports = router;