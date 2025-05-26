const review = require("../models/review");


/**
 * Skapar ett betyg på en produkt.
 * @param {object} res 
 * @param {object} param1 - nytt betyg.
 * @param {string} createdOn - på vilken produkt.
 * @returns 
 */
async function createReview(res, { rating, message, createdBy, updatedBy }, createdOn) {
    try {
        const result = await review.create({ rating, message, createdOn, createdBy, updatedBy });
        return res.status(201).json({ message: "Lyckades lägga till betyg.", review: result });
    } catch (error) {
        return res.status(400).json({ error: "Kunde inte lägga till betyg." });
    }
}

module.exports = { createReview };