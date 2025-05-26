const category = require("../models/category");
const { slugify } = require("./slugify");

async function createCategory(res, { name, createdBy, updatedBy }) {
    const nameObject = {
        normal: name,
        slug: slugify(name)
    };
    try {
        const result = await category.create({ name: nameObject, createdBy, updatedBy});
        return res.status(201).json({ message: "Lyckades skapa kategori.", category: result});
    } catch (error) {
        return res.status(400).json({ error: "Kunde inte skapa kategori." });
    }
}

module.exports = { createCategory };