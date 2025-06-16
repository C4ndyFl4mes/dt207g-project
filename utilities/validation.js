const { body, validationResult } = require('express-validator');
const Response = require('./response');

// Massa validerings regler.

const userValidationRules = () => [
    body("firstname")
        .trim()
        .escape()
        .isLength({ min: 2, max: 32 })
        .withMessage("Förnamn måste vara mellan två och 32 tecken."),

    body("lastname")
        .trim()
        .escape()
        .isLength({ min: 2, max: 32 })
        .withMessage("Efternamn måste vara mellan två och 32 tecken."),
    body("email")
        .trim()
        .escape()
        .isEmail()
        .withMessage("E-Post är felaktig."),
    body("password")
        .isStrongPassword()
        .withMessage("Lösenordet måste vara starkt (minst åtta tecken, versaler/gemener, siffror, symboler)."),
    body("role")
        .optional({ checkFalsy: true })
        .trim()
        .escape()
        .matches("user")
        .withMessage("Felaktig roll.")
];

const editUserValidationRules = () => [
    body("firstname")
        .trim()
        .escape()
        .isLength({ min: 2, max: 32 })
        .withMessage("Förnamn måste vara mellan två och 32 tecken."),

    body("lastname")
        .trim()
        .escape()
        .isLength({ min: 2, max: 32 })
        .withMessage("Efternamn måste vara mellan två och 32 tecken.")
];

const adminValidationRules = () => [
    body("firstname")
        .trim()
        .escape()
        .isLength({ min: 2, max: 32 })
        .withMessage("Förnamn måste vara mellan två och 32 tecken."),

    body("lastname")
        .trim()
        .escape()
        .isLength({ min: 2, max: 32 })
        .withMessage("Efternamn måste vara mellan två och 32 tecken."),
    body("email")
        .trim()
        .escape()
        .isEmail()
        .withMessage("E-Post är felaktig."),
    body("password")
        .isStrongPassword()
        .withMessage("Lösenordet måste vara starkt (minst åtta tecken, versaler/gemener, siffror, symboler)."),
    body("role")
        .trim()
        .escape()
        .matches("admin")
        .withMessage("Felaktig roll.")
];

const productValidationRules = () => [
    body("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Produktnamn måste vara mellan två och 100 tecken."),
    body("price")
        .trim()
        .escape()
        .isFloat()
        .withMessage("Priset måste vara ett tal."),
    body("description")
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Beskrivningen får inte överstiga 2000 tecken.")
];

const categoryValidationRules = () => [
    body("name")
        .trim()
        .escape()
        .isLength({ max: 50, min: 2 })
        .withMessage("Kategorinamn måste vara mellan två och 50 tecken.")
];


const reviewValidationRules = () => [
    body("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Betyg måste vara mellan ett till fem."),
    body("message")
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Meddelandet får inte överskrida 2000 tecken.")
];

const validate = (req, res, next) => {
    const invalid = new Response(res, false, 400, "Misslyckades, det finns felaktiga fält.");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return invalid.send(errors.array());
    }
    next();
};

module.exports = { userValidationRules, editUserValidationRules, adminValidationRules, productValidationRules, categoryValidationRules, reviewValidationRules, validate };