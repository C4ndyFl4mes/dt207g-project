const jwt = require('jsonwebtoken');
const Response = require('./response');

/**
 * Genererar en token till användaren vid inloggning.
 * @param {object} user - den inloggade användaren.
 * @returns token 
 */
function generateToken(user) {
    console.log(user);
    const payload = {
        id: user._id,
        fullName: `${user.firstname} ${user.lastname}`,
        role: user.role,
        joined: user.createdAt,
        updated: user.updatedAt
    };
    return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1h' });
}

/**
 * Autentiserar och auktoriserar till en route.
 * @param {Array} allowedRoles - tillåtna roller till en route.
 * @returns 
 */
function authorize(allowedRoles) {
    return (req, res, next) => {
        const missing = new Response(res, false, 401, "Token saknas.");
        const incorrect = new Response(res, false, 403, "Inkorrekt token.");
        const unauthorized = new Response(res, false, 403, "Åtkomst nekad: Du har otillräckliga behörigheter.");

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return missing.send();
        }

        jwt.verify(token, process.env.JWT_KEY, (error, payload) => {
            if (error) {
                return incorrect.send();
            } else {
                req.user = payload;
                if (!allowedRoles.includes(payload.role)) {
                    return unauthorized.send();
                }
                next();
            }
        });
    };
}

module.exports = { generateToken, authorize };