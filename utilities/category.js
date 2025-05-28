const category = require("../models/category");
const { slugify } = require("./slugify");
const Response = require("./response");

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
async function getCategories(res) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const success = new Response(res, true, 200, "Lyckades hämta kategorier.");
    try {
        const result = await category.find();
        success.send({ result });
    } catch (error) {
        return server.send();
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
        const result = await category.create({ name: nameObject, createdBy: initiator.id, updatedBy: initiator.id });
        return success.send({ result });
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
async function editCategory(res, target, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 200, "Lyckades ändra kategori.");

    try {
        const id = await getCategoryIDbyName(target.currentName);
        const result = await category.findByIdAndUpdate(id, {
            $set: {
                name: {
                    normal: target.newName,
                    slug: slugify(target.newName)
                },
                updatedBy: initiator.id
            }
        }, { new: true, runValidators: true });

        if (!result) {
            return notFound.send();
        }

        return success.send({ result });
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
 * @param {object} initiator - vem som raderar kategorin. Kommer troligtvis att användas när log fixas.
 * @returns 
 */
async function deleteCategory(res, target, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 200, "Lyckades radera kategori.");

    try {
        const id = await getCategoryIDbyName(target.name);
        const result = await category.findByIdAndDelete(id);

        if (!result) {
            return notFound.send();
        }

        return success.send({ result });
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