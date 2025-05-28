const product = require("../models/product");
const { getCategoryIDbyName } = require("./category");
const { slugify } = require("./slugify");
const Response = require("./response");

/**
 * Hämtar ett id beroende på produktnamn.
 * @param {string} name - namnet på produkten.
 * @returns 
 */
async function getProductIDbyName(name) {
    const result = await product.findOne({ $or: [{ "name.normal": name }, { "name.slug": name }] });
    if (!result) {
        const err = new Error("Produkt finns inte");
        err.status = 404;
        throw err;
    }
    return result._id;
}

/**
 * Hämtar alla produkter.
 * @param {object} res 
 * @param {object} query - används för paginering.
 * @returns 
 */
async function getProducts(res, query) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const success = new Response(res, true, 200, "Lyckades hämta produkter.");
    try {
        const page = parseInt(query.page);
        const limit = parseInt(query.limit);

        const totalItems = await product.countDocuments();
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        const result = await product.find().skip(skip).limit(limit);
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };
        return success.send({ pagination, result });
    } catch (error) {
        return server.send();
    }
}

/**
 * Hämtar alla produkter i en kategori.
 * @param {object} res 
 * @param {string} inCategory - namnet på kategorin.
 * @param {object} query - används för paginering.
 * @returns 
 */
async function getProductsInCategory(res, inCategory, query) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 201, "Lyckades hämta produkter från kategori.");

    try {
        inCategory = await getCategoryIDbyName(inCategory);
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;

        const totalItems = await product.countDocuments({ "inCategory": inCategory });
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        const result = await product.find({ "inCategory": inCategory }).skip(skip).limit(limit);
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };
        success.send({ pagination, result });
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
 * Hämtar en produkt beroende på kategori och produktnamn.
 * @param {object} res 
 * @param {string} inCategory - vilken kategori.
 * @param {string} productN - produktnamnet.
 * @returns 
 */
async function getProduct(res, inCategory, productN) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori eller produkt finns inte.");
    const success = new Response(res, true, 201, "Lyckades hämta produkt.");

    try {
        inCategory = await getCategoryIDbyName(inCategory);
        productN = await getProductIDbyName(productN);
        const result = await product.findOne({ $and: [{ "inCategory": inCategory }, { "_id": productN }] });
        success.send({ result });
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
 * Skapar en ny produkt.
 * @param {object} res 
 * @param {object} param1 - ny produkt.
 * @returns 
 */
async function createProduct(res, { name, price, description, onSale, sale, inCategory }, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 201, "Lyckades lägga till produkt.");
    const nameObject = {
        normal: name,
        slug: slugify(name)
    };

    try {
        inCategory = await getCategoryIDbyName(inCategory);
        const result = await product.create({ name: nameObject, price, description, onSale, sale, inCategory, createdBy: initiator.id, updatedBy: initiator.id });
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
 * Ändrar en produkt.
 * @param {object} res 
 * @param {object} target - vilken produkt som ska ändras samt de nya värdena.
 * @param {object} initiator - vem som utför ändringen.
 * @returns 
 */
async function editProduct(res, { id, name, price, description, onSale, sale, inCategory }, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const notFoundProduct = new Response(res, false, 404, "Produkt finns inte.");
    const success = new Response(res, true, 201, "Lyckades ändra produkt.");

    try {
        inCategory = await getCategoryIDbyName(inCategory);
        const result = await product.findByIdAndUpdate(id, {
            $set: {
                name: {
                    normal: name,
                    slug: slugify(name)
                },
                price,
                description,
                onSale,
                sale,
                inCategory,
                updatedBy: initiator.id
            }
        }, { new: true, runValidators: true });

        if (!result) {
            return notFoundProduct.send();
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
 * Raderar en produkt.
 * @param {object} res 
 * @param {string} targetID - vilken produkt som ska raderas.
 * @param {object} initiator - vem som utför raderingen. Kommer troligtvis användas när log fixas.
 * @returns 
 */
async function deleteProduct(res, targetID, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Produkt finns inte.");
    const success = new Response(res, true, 201, "Lyckades ändra produkt.");

    try {
        const result = await product.findByIdAndDelete(targetID);

        if (!result) {
            return notFound.send();
        }

        return success.send({ result });
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }

        return server.send();
    }
}

module.exports = { getProducts, getProductsInCategory, getProduct, createProduct, editProduct, deleteProduct };