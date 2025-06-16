const review = require("../models/review");
const Response = require("./response");
const dayjs = require('dayjs');

/**
 * Kollar om användaren redan lagt till en recension till produkten.
 * @param {object} res 
 * @param {string} targetID - vilken produkt det handlar om.
 * @param {object} initiator - vem som kollas.
 * @returns 
 */
async function alreadyPostedReviewOnProduct(res, targetID, initiator) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    // 200 för att skippa onödigt felmeddelande då vi ändå vill veta ifall användaren har redan gjort en recension för den produkten:
    const cannotPostMultipleReviews = new Response(res, false, 200, "Du kan bara skriva en recension per produkt.");
    const success = new Response(res, true, 200, "Användaren har inte lagt till någon recension till denna produkt.");

    try {
        const formerReviews = await getReviewsByUser(initiator.id); // Hämtar recensioner för användaren.

        // Loopar igenom för att hitta om användaren redan lagt till en recension till produkten.
        for (const formerReview of formerReviews) {
            if (formerReview.createdOn.equals(targetID)) {
                return cannotPostMultipleReviews.send();
            }
        }
        return success.send();
    } catch (error) {

        if (error.name === "CastError") {
            return invalidID.send();
        }

        console.error(error);
        return server.send();
    }
}

/**
 * Hämtar recensioner för användare.
 * @param {string} initiatorID - vilken användares recensioner.
 * @param {boolean} display - enbart för att formattera endast när det ska skickas direkt från API:n.
 * @param {number} page - vilken sida användaren hamnar på när det pagineras.
 * @param {number} limit - antalet recensioner per sida.
 * @returns 
 */
async function getReviewsByUser(initiatorID, display, page = 1, limit = 10) {
    if (!display) {
        const result = await review.find({ "createdBy": initiatorID });
        return result;
    } else {
        page = parseInt(page);
        limit = parseInt(limit);

        const totalItems = await review.countDocuments({ "createdBy": initiatorID });
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;
        const result = await review.find({ "createdBy": initiatorID }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("createdOn", "name.normal -_id").lean();
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };

        const formatted = result.map(r => ({
            id: r._id,
            rating: r.rating,
            message: r.message,
            product: r.createdOn?.name.normal || null,
            posted: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
            edited: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
        }));
        return { pagination, reviews: formatted };
    }
}

/**
 * Hämtar recensioner för en produkt.
 * @param {string} targetID - vilken produkt som recensionerna tillhör.
 * @param {boolean} display - enbart för att formattera endast när det ska skickas direkt från API:n.
 * @param {number} page - vilken sida användaren hamnar på när det pagineras.
 * @param {number} limit - antalet recensioner per sida.
 * @returns 
 */
async function getReviewsOnProduct(targetID, display, page = 1, limit = 10) {
    if (!display) {
        const result = await review.find({ "createdOn": targetID });
        return result;
    } else {
        page = parseInt(page);
        limit = parseInt(limit);

        const totalItems = await review.countDocuments({ "createdOn": targetID });
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;
        const result = await review.find({ "createdOn": targetID }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("createdBy", "firstname lastname").lean();
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };

        const formatted = result.map(r => ({
            id: r._id,
            createdBy: r.createdBy?._id,
            rating: r.rating,
            message: r.message,
            fullname: (r.createdBy?.firstname + " " + r.createdBy?.lastname) || null,
            posted: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
            edited: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
        }));

        return { pagination, reviews: formatted };
    }
}

/**
 * Skapar en recension på en produkt.
 * @param {object} res 
 * @param {object} post - ny recension, message och rating.
 * @param {object} initiator - vem som lägger upp recensionen.
 * @param {string} targetID - på vilken produkt.
 * @returns 
 */
async function createReview(res, post, initiator, targetID) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Produkt finns inte.");
    const cannotPostMultipleReviews = new Response(res, false, 403, "Du kan bara skriva en recension per produkt.");
    const success = new Response(res, true, 201, "Lyckades lägga till recension.");

    try {

        const formerReviews = await getReviewsByUser(initiator.id); // Hämtar recensioner för användaren.

        // Loopar igenom för att hitta om användaren redan lagt till en recension till produkten.
        for (const formerReview of formerReviews) {
            if (formerReview.createdOn.equals(targetID)) {
                return cannotPostMultipleReviews.send();
            }
        }

        await review.create({ rating: post.rating, message: post.message, createdBy: initiator.id, updatedBy: initiator.id, createdOn: targetID })

        return success.send();
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
 * Ändrar en recension.
 * @param {object} res 
 * @param {object} post - betyg och meddelande tillhörande recensionen.
 * @param {object} initiator - vem som utför handlingen.
 * @param {string} targetID - vilken recension det handlar om.
 * @returns 
 */
async function editReview(res, post, initiator, targetID) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Recensionen finns inte.");
    const unauthEditOtherReviews = new Response(res, false, 403, "Du har inte behörigheter till att ändra andras recensioner.");
    const success = new Response(res, true, 200, "Lyckades uppdatera recension.");

    try {
        const formerReviews = await getReviewsByUser(initiator.id); // Hämtar recensioner för användaren.

        // Kollar om användaren äger recensionen.
        const match = [];
        for (let i = 0; i < formerReviews.length; i++) {
            if (formerReviews[i]._id.toString() === targetID) {
                match.push(targetID);
            }
        }
        if (match.length === 0) {
            return unauthEditOtherReviews.send();
        }

        const result = await review.findByIdAndUpdate(targetID, {
            $set: {
                rating: post.rating,
                message: post.message,
                updatedBy: initiator.id
            }
        }, { new: true, runValidators: true });

        if (!result) {
            return notFound.send();
        }

        return success.send();

    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        return server.send();
    }
}

/**
 * Raderar en recension.
 * @param {object} res 
 * @param {object} initiator - vem som utför handlingen.
 * @param {object} targetID - vilken recension som ska raderas.
 * @returns 
 */
async function deleteReview(res, initiator, targetID) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Recensionen finns inte.");
    const unauthDeleteOtherReviews = new Response(res, false, 403, "Du har inte behörigheter till att ta bort andras recensioner.");
    const success = new Response(res, true, 200, "Lyckades radera recension.");

    try {
        if (initiator.role === "user") {
            const formerReviews = await getReviewsByUser(initiator.id); // Hämtar recensioner för användaren.

            // Kollar om användaren äger recensionen.
            const match = [];
            for (let i = 0; i < formerReviews.length; i++) {
                if (formerReviews[i]._id.toString() === targetID) {
                    match.push(targetID);
                }
            }
            if (match.length === 0) {
                return unauthDeleteOtherReviews.send();
            }

            const result = await review.findByIdAndDelete(targetID);
            if (!result) {
                return notFound.send();
            }
            return success.send();
        } else if (initiator.role === "admin" || initiator.role === "root") {
            // Admin eller root kan radera andras recensioner.
            const result = await review.findByIdAndDelete(targetID);
            if (!result) {
                return notFound.send();
            }
            return success.send();
        }
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        return server.send();
    }

}

module.exports = { createReview, editReview, deleteReview, getReviewsByUser, getReviewsOnProduct, alreadyPostedReviewOnProduct };