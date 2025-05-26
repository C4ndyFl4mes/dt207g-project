const express = require('express');
const { reviewValidationRules, validate } = require('../utilities/validation');
const { createReview } = require('../utilities/review');
const router = express.Router();

router.get("/product/:id", (req, res) => {

});

router.post("/product/:id", reviewValidationRules(), validate, (req, res) => {
    createReview(res, req.body, req.params.id);
});

module.exports = router;