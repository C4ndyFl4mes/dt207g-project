const product = require("../models/product");
const { slugify } = require("./slugify");


/**
 * Skapar en ny produkt.
 * @param {object} res 
 * @param {object} param1 - ny produkt.
 * @returns 
 */
async function createProduct(res, { name, price, description, onSale, sale, createdBy, updatedBy }) {
    const nameObject = {
        normal: name,
        slug: slugify(name)
    };
    try {
        const result = await product.create({ name: nameObject, price, description, onSale, sale, createdBy, updatedBy });
        return res.status(201).json({ message: "Lyckades lägga till produkt.", product: result});
    } catch (error) {
        return res.status(400).json({ error: "Kunde inte lägga till produkt." });
    }
}

module.exports = { createProduct };