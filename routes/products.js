const express = require('express');
const router = express.Router();
const { productValidationRules, validate, categoryValidationRules } = require('../utilities/validation');
const { createProduct } = require('../utilities/product');
const { createCategory } = require('../utilities/category');

// Hämta alla produkter:
router.get("/", (req, res) => {
    return res.status(200).json({products: ["a", "b", "c"]});
});

// Hämta alla kategorier:
router.get("/categories", (req, res) => {
    return res.status(200).json({categories: ["d", "e", "f"]});
});

// Hämta alla produkter från en kategori.
router.get("/category/:categoryname", (req, res) => {
    return res.status(200).json({category: req.params.categoryname, products: ["a"]});
});

// Hämta en produkt specifik produkt.
router.get("/:categoryname/:productname", (req, res) => {
    return res.status(200).json({category: req.params.categoryname, product: req.params.productname, details: {name: "Bannan"}});
});

router.post("/product", productValidationRules(), validate, (req, res) => {
    createProduct(res, req.body);
});

router.post("/category", categoryValidationRules(), validate, (req, res) => {
    createCategory(res, req.body);
});

module.exports = router;
