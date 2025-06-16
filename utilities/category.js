const category = require("../models/category");
const { slugify } = require("./slugify");
const Response = require("./response");
const dayjs = require('dayjs');
const product = require("../models/product");
const review = require("../models/review");

/**
 * Hämtar kategoriid bereonde på namn.
 * @param {string} name - kategorinamn.
 * @returns 
 */
async function getCategoryIDbyName(name) {
    const result = await category.findOne({ $or: [{ "name.normal": name }, { "name.slug": name }] });
    if (!result) {
        const err = new Error("Kategori finns inte");
        err.status = 404;
        throw err;
    }
    return result._id;
}

/**
 * Hämtar alla kategorier.
 * @param {object} res 
 * @returns 
 */
async function getCategories(res, page, limit) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const success = new Response(res, true, 200, "Lyckades hämta kategorier.");
    if (page && limit) {
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const totalItems = await category.countDocuments();
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;
        const result = await category.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

        const formatted = result.map(r => ({
            id: r._id,
            name: r.name,
            created: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
            updated: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
        }));
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };

        return success.send({ pagination, categories: formatted });
    } else {
        try {
            const result = await category.find();
            const formatted = result.map(r => ({
                id: r._id,
                name: r.name,
                created: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
                updated: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
            }));
            success.send({ categories: formatted });
        } catch (error) {
            return server.send();
        }
    }
}

/**
 * Skapar en kategori.
 * @param {object} res 
 * @param {object} name - kategorinamn.
 * @param {object} initiator - vem som skapade kategorin.
 * @returns 
 */
async function createCategory(res, name, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const success = new Response(res, true, 201, "Lyckades skapa kategori.");
    const nameObject = {
        normal: name,
        slug: slugify(name)
    };
    try {
        await category.create({ name: nameObject, createdBy: initiator.id, updatedBy: initiator.id });
        return success.send();
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        return server.send();
    }
}

/**
 * Ändrar en kategori.
 * @param {object} res 
 * @param {object} target - kategorin som ska ändras.
 * @param {object} initiator - vem som ändrar kategorin.
 * @returns 
 */
async function editCategory(res, name, targetID, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 200, "Lyckades ändra kategori.");

    try {
        const result = await category.findByIdAndUpdate(targetID, {
            $set: {
                name: {
                    normal: name,
                    slug: slugify(name)
                },
                updatedBy: initiator.id
            }
        }, { new: true, runValidators: true });

        if (!result) {
            return notFound.send();
        }
        return success.send();
    } catch (error) {
        if (error.status === 404) {
            return notFound.send();
        }

        if (error.name === "CastError") {
            return invalidID.send();
        }

        return server.send();
    }
}

/**
 * Raderar en kategori.
 * @param {object} res 
 * @param {object} target - vilken kategori som ska raderas.
 * @returns 
 */
async function deleteCategory(res, targetID) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 200, "Lyckades radera kategori.");

    try {
        const result = await category.findByIdAndDelete(targetID);

        if (!result) {
            return notFound.send();
        }

        const productsInCategory = await product.find({ inCategory: targetID }).select('_id');
        const productIds = productsInCategory.map(p => p._id);

        await product.deleteMany({ _id: { $in: productIds } });

        await review.deleteMany({ createdOn: { $in: productIds } });

        return success.send();
    } catch (error) {
        if (error.status === 404) {
            return notFound.send();
        }

        if (error.name === "CastError") {
            return invalidID.send();
        }

        return server.send();
    }
}

module.exports = { getCategories, createCategory, getCategoryIDbyName, editCategory, deleteCategory };