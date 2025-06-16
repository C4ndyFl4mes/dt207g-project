const product = require("../models/product");
const { getCategoryIDbyName } = require("./category");
const { slugify } = require("./slugify");
const Response = require("./response");
const { getReviewsOnProduct } = require("./review");
const dayjs = require('dayjs');
const review = require("../models/review");
const category = require("../models/category");

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
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;

        const totalItems = await product.countDocuments();
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        const result = await product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("inCategory", "name").lean();
        // Nestlad loop för att räkna ut varenda produkts genomsnittsbetyg.
        for (let i = 0; i < result.length; i++) {
            const reviews = await getReviewsOnProduct(result[i]._id, false);
            if (reviews && reviews.length > 0) {
                let totalPoints = 0;
                for (let r = 0; r < reviews.length; r++) {
                    totalPoints += reviews[r].rating;
                }
                result[i].rating = totalPoints / reviews.length;
            } else {
                result[i].rating = 0;
            }
        }
       
        const formatted = result.map(r => ({
            id: r._id,
            name: {
                normal: r.name.normal,
                slug: r.name.slug
            },
            price: r.price,
            rating: r.rating,
            inCategory: {
                id: r.inCategory._id,
                name: r.inCategory.name
            },
            description: r.description,
            created: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
            updated: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
        }));
        
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };
        return success.send({ pagination, products: formatted });
    } catch (error) {
        console.error(error);
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
async function getProductsInCategory(res, categoryID, query) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 201, "Lyckades hämta produkter från kategori.");

    try {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;

        const category = await getCategoryIDbyName(categoryID)

        const totalItems = await product.countDocuments({ "inCategory": category });
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        const result = await product.find({ "inCategory": category }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("inCategory", "name").lean();

        // Nestlad loop för att räkna ut varenda produkts genomsnittsbetyg.
        for (let i = 0; i < result.length; i++) {
            const reviews = await getReviewsOnProduct(result[i]._id, false);
            if (reviews && reviews.length > 0) {
                let totalPoints = 0;
                for (let r = 0; r < reviews.length; r++) {
                    totalPoints += reviews[r].rating;
                }
                result[i].rating = totalPoints / reviews.length;
            } else {
                result[i].rating = 0;
            }
        }

        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };

        const formatted = result.map(r => ({
            id: r._id,
            name: {
                normal: r.name.normal,
                slug: r.name.slug
            },
            price: r.price,
            inCategory: {
                id: r.inCategory._id,
                name: r.inCategory.name
            },
            rating: r.rating,
            description: r.description,
            created: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
            updated: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
        }));

        success.send({ pagination, products: formatted });
    } catch (error) {
        if (error.status === 404) {
            return notFound.send();
        }

        if (error.name === "CastError") {
            return invalidID.send();
        }
        console.error(error);
        return server.send();
    }
}

/**
 * Hämtar en specifik produkt efter kategori- och produktnamn.
 * @param {object} res 
 * @param {string} categoryN - kategorinamn slugified.
 * @param {string} productN - produktnamn slugified.
 * @param {object} query - page och limit.
 * @returns 
 */
async function getProductFromSlug(res, categoryN, productN, query) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori eller produkt finns inte.");
    const success = new Response(res, true, 201, "Lyckades hämta produkt.");

    try {
        const categoryID = await getCategoryIDbyName(categoryN); // Hämtar kategoriID på namn.
        const nameID = await getProductIDbyName(productN); // Hämtar produktID på namn.
        const result = await product.findOne({ $and: [{ inCategory: categoryID }, { _id: nameID }] }).populate("inCategory", "name.normal name.slug").lean();
        const reviews = await getReviewsOnProduct(nameID, true, query.page, query.limit);
        let totalrating = 0;

        for (let i = 0; i < reviews.reviews.length; i++) {
            totalrating += reviews.reviews[i].rating;
        }
        const avgRating = totalrating / reviews.reviews.length;

        const formatted = {
            id: result._id,
            name: result.name,
            price: result.price,
            inCategory: result.inCategory,
            rating: avgRating,
            description: result.description,
            created: dayjs(result.createdAt).format("YYYY-MM-DD HH:mm"),
            updated: dayjs(result.updatedAt).format("YYYY-MM-DD HH:mm")
        };


        success.send({ product: formatted, reviews_section: reviews });
    } catch (error) {
        if (error.status === 404) {
            return notFound.send();
        }

        if (error.name === "CastError") {
            return invalidID.send();
        }
        console.error(error);
        return server.send();
    }
}

/**
 * Skapar en ny produkt.
 * @param {object} res 
 * @param {object} param1 - ny produkt.
 * @returns 
 */
async function createProduct(res, { name, price, description, inCategory }, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const success = new Response(res, true, 201, "Lyckades lägga till produkt.");
    const nameObject = {
        normal: name,
        slug: slugify(name)
    };

    try {
        await product.create({ name: nameObject, price, description, inCategory, createdBy: initiator.id, updatedBy: initiator.id });

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
 * Ändrar en produkt. Enbart användaren kan ändra ens egen recension, admin och root kan bara ta bort andras.
 * @param {object} res 
 * @param {object} target - vilken produkt som ska ändras samt de nya värdena.
 * @param {object} initiator - vem som utför ändringen.
 * @returns 
 */
async function editProduct(res, id, { name, price, description, inCategory }, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Kategori finns inte.");
    const notFoundProduct = new Response(res, false, 404, "Produkt finns inte.");
    const success = new Response(res, true, 201, "Lyckades ändra produkt.");

    try {
        const result = await product.findByIdAndUpdate(id, {
            $set: {
                name: {
                    normal: name,
                    slug: slugify(name)
                },
                price,
                description,
                inCategory,
                updatedBy: initiator.id
            }
        }, { new: true, runValidators: true });

        if (!result) {
            return notFoundProduct.send();
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
 * Raderar en produkt.
 * @param {object} res 
 * @param {string} targetID - vilken produkt som ska raderas.
 * @returns 
 */
async function deleteProduct(res, targetID) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Produkt finns inte.");
    const success = new Response(res, true, 201, "Lyckades radera produkt.");

    try {
        const result = await product.findByIdAndDelete(targetID);

        if (!result) {
            return notFound.send();
        }

        const reviews = await getReviewsOnProduct(targetID);

        reviews.forEach(async deletereview => {
            await review.findByIdAndDelete(deletereview._id);
        });

        return success.send();
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }

        return server.send();
    }
}

module.exports = { getProducts, getProductsInCategory, getProductIDbyName, getProductFromSlug, createProduct, editProduct, deleteProduct };