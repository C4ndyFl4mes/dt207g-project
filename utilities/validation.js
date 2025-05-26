const { body, validationResult } = require('express-validator');

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

    body("password")
        .isStrongPassword()
        .withMessage("Lösenordet måste vara starkt (minst åtta tecken, versaler/gemener, siffror, symboler).")
];

const productValidationRules = () => [
    body("name")
        .trim()
        .escape()
        .isLength({ min: 2, max: 100})
        .withMessage("Produktnamn måste vara mellan två och 100 tecken."),
    body("price")
        .trim()
        .escape()
        .isNumeric()
        .withMessage("Priset måste vara ett tal."),
    body("description")
        .trim()
        .escape()
        .isLength({max: 300})
        .withMessage("Beskrivningen får inte överstiga 300 tecken."),
    body("onSale")
        .optional({ checkFalsy: true })
        .trim()
        .escape()
        .isBoolean()
        .withMessage("På rea måste vara sant eller falskt."),
    body("sale")
        .optional({ checkFalsy: true })
        .trim()
        .escape()
        .isLength({ min: 2, max: 3})
        .withMessage("Rea måste vara antingen två eller tre tecken.")
];

const categoryValidationRules = () => [
    body("name")
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage("Kategorinamn får inte överstiga 50 tecken.")
];

const reviewValidationRules = () => [
    body("rating")
        .trim()
        .escape()
        .isInt({ min: 1, max: 5 })
        .withMessage("Betyg måste vara mellan ett till fem."),
    body("message")
        .trim()
        .escape()
        .isLength({ max: 300 })
        .withMessage("Meddelandet får inte överskrida 300 tecken.")
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = { userValidationRules, productValidationRules, categoryValidationRules, reviewValidationRules, validate };