const user = require("../models/user");

/**
 * Skapar en ny användare.
 * @param {object} res 
 * @param {object} param1 - ny användare.
 * @returns 
 */
async function createUser(res, { firstname, lastname, password, role, createdBy, updatedBy }) {
    try {
        const result = await user.create({ firstname, lastname, password, role, createdBy, updatedBy });
        return res.status(201).json({ message: "Lyckades lägga till användaren.", user: result });
    } catch (error) {
        return res.status(400).json({ error: "Kunde inte lägga till användaren." });
    }
}

module.exports = { createUser };