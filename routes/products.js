const express = require('express');
const router = express.Router();
const { productValidationRules, validate, categoryValidationRules } = require('../utilities/validation');
const { createProduct, editProduct, deleteProduct, getProducts, getProductsInCategory, getProductFromSlug } = require('../utilities/product');
const { createCategory, editCategory, deleteCategory, getCategories } = require('../utilities/category');
const { authorize } = require('../utilities/token');

// Hämta alla produkter. Har query parametrarna page och limit för pagination.
router.get("/", (req, res) => {
    getProducts(res, req.query);
});

// Hämta alla produkter från en kategori. Har query parametrarna page och limit för pagination.
router.get("/category/:id", (req, res) => {
    getProductsInCategory(res, req.params.id, req.query);
});

// Hämtar en specifik produkt efter kategori- och produktnamn.
router.get("/:category/:product", (req, res) => {
    getProductFromSlug(res, req.params.category, req.params.product, req.query);
});

// Skapar en produkt.
router.post("/product", authorize(['admin', 'root']), productValidationRules(), validate, (req, res) => {
    createProduct(res, req.body, req.user);
});

// Ändrar en produkt.
router.put("/product/:id", authorize(['admin', 'root']), productValidationRules(), validate, (req, res) => {
    editProduct(res, req.params.id, req.body, req.user);
});

// Raderar en produkt.
router.delete("/product/:id", authorize(['admin', 'root']), (req, res) => {
    deleteProduct(res, req.params.id);
});

// Hämta alla kategorier:
router.get("/categories", (req, res) => {
    getCategories(res, req.query.page, req.query.limit);
});

// Skapar en kategori.
router.post("/category", authorize(['admin', 'root']), categoryValidationRules(), validate, (req, res) => {
    createCategory(res, req.body.name, req.user);
});

// Ändrar en kategori.
router.put("/category/:id", authorize(['admin', 'root']), categoryValidationRules(), validate, (req, res) => {
    editCategory(res, req.body.name, req.params.id, req.user);
});

// Raderar en kategori.
router.delete("/category/:id", authorize(['admin', 'root']), (req, res) => {
    deleteCategory(res, req.params.id);
});

module.exports = router;
