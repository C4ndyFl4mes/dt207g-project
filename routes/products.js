const express = require('express');
const router = express.Router();
const { productValidationRules, validate, categoryValidationRules, editCategoryValidationRules } = require('../utilities/validation');
const { createProduct, editProduct, deleteProduct, getProducts, getProductsInCategory, getProduct } = require('../utilities/product');
const { createCategory, editCategory, deleteCategory, getCategories } = require('../utilities/category');
const { authorize } = require('../utilities/token');

// Hämta alla produkter. Har query parametrarna page och limit för pagination.
router.get("/", (req, res) => {
    getProducts(res, req.query);
});

// Hämta alla produkter från en kategori. Har query parametrarna page och limit för pagination.
router.get("/:categoryname", (req, res) => {
    getProductsInCategory(res, req.params.categoryname, req.query);
});

// Hämta en produkt specifik produkt.
router.get("/:categoryname/:productname", (req, res) => {
    getProduct(res, req.params.categoryname, req.params.productname);
});

// Skapar en produkt.
router.post("/product", authorize(['admin', 'root']), productValidationRules(), validate, (req, res) => {
    createProduct(res, req.body, req.user);
});

// Ändrar en produkt.
router.put("/product", authorize(['admin', 'root']), productValidationRules(), validate, (req, res) => {
    editProduct(res, req.body, req.user);
});

// Raderar en produkt.
router.delete("/product", authorize(['admin', 'root']), (req, res) => {
    deleteProduct(res, req.body.id, req.user);
});

// Hämta alla kategorier:
router.get("/categories", (req, res) => {
    getCategories(res);
});

// Skapar en kategori.
router.post("/category", authorize(['admin', 'root']), categoryValidationRules(), validate, (req, res) => {
    createCategory(res, req.body.name, req.user);
});

// Ändrar en kategori.
router.put("/category", authorize(['admin', 'root']), editCategoryValidationRules(), validate, (req, res) => {
    editCategory(res, req.body, req.user);
});

// Raderar en kategori.
router.delete("/category", authorize(['admin', 'root']), (req, res) => {
    deleteCategory(res, req.body, req.user);
});

module.exports = router;
