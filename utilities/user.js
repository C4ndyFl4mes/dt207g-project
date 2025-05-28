const user = require("../models/user");
const bcrypt = require('bcrypt');
const { generateToken } = require("./token");
const Response = require("./response");

/**
 * Hämtar en användare.
 * @param {string} id - användarid.
 * @returns 
 */
async function getUser(id) {
    const account = await user.findById(id);
    if (!account) {
        const err = new Error("Konto finns inte.");
        err.status = 404;
        throw err;
    }
    return account;
}

/**
 * Hämtar en profil.
 * @param {object} res 
 * @param {object} initiator - vem som förfrågar.
 * @param {object} target - den profil som ska hämtas.
 * @returns 
 */
async function getProfile(res, initiator, target) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Användaren finns inte.");
    const success = new Response(res, true, 201, "Lyckades hämta profil.");

    try {
        // Kontrollerar att vanliga inloggade användare endast kan se sin egen profil oavsett query, men admin och root kan använda query för att se andra användares profiler.
        if (initiator.role === 'user') {
            target.id = initiator.id;
        } else if (!target.id) {
            target.id = initiator.id;
        }

        const account = await getUser(target.id);

        
        success.send({ result: { account } });
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
 * Hämtar användare beroende på query.
 * @param {object} res 
 * @param {object} param1 - query som filtrerar och paginerar.
 * @returns 
 */
async function getUsers(res, { roles, firstname, lastname, page = 1, limit = 10 }) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const success = new Response(res, true, 201, "Lyckades hämta användare.");
    try {
        page = parseInt(page);
        limit = parseInt(limit);

        const filter = {};

        if (roles) filter.role = { $in: roles.split(',') };
        if (firstname) filter.firstname = { $regex: firstname, $options: 'i' };
        if (lastname) filter.lastname = { $regex: lastname, $options: 'i' };
        
        const totalItems = await user.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        const result = await user.find(filter).skip(skip).limit(limit);
        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };
        return success.send({ pagination, result });
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        return server.send();
    }
}

/**
 * Skapar en ny användare.
 * @param {object} res 
 * @param {object} param1 - ny användare.
 * @returns 
 */
async function createUser(res, { firstname, lastname, email, password, role, createdBy, updatedBy }, initiator = null) {
    // Hantering:
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const conflict = new Response(res, false, 409, "E-Post addressen är redan registrerad.");
    const success = new Response(res, true, 201, "Lyckades lägga till användaren.");

    if (initiator) {
        createdBy = initiator.id;
        updatedBy = initiator.id;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await user.create({ firstname, lastname, email, password: hashedPassword, role, createdBy, updatedBy });
        return success.send();
    } catch (error) {
        if (error.code === 11000) {
            return conflict.send();
        }

        if (error.name === "CastError") {
            return invalidID.send();
        }

        return server.send();
    }
}

/**
 * Loggar in en användare och returnerar en token
 * @param {object} res 
 * @param {object} param1 - användaren som ska logga in.
 * @returns 
 */
async function loginUser(res, { email, password }) {
    // Hantering:
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const input = new Response(res, false, 400, "E-Post address eller lösenord är felaktig.");
    const notFound = new Response(res, false, 404, "Användaren finns inte.");
    const success = new Response(res, true, 200, "Inloggningen lyckades.");

    try {
        const account = await user.findOne({ email });
        if (!account) {
            return notFound.send();
        }
        const match = await bcrypt.compare(password, account.password);
        if (match) {
            const token = generateToken(account);
            return success.send({ token, account });
        } else {
            return input.send();
        }
    } catch (error) {
        return server.send();
    }
}

/**
 * Ändrar en användare, olika roller har olika behörigheter.
 * @param {object} res 
 * @param {object} initiator - vem som utför ändringen.
 * @param {object} target - vem ändringen är menad för.
 * @returns 
 */
async function editUser(res, initiator, target) {
    // Hantering:
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const invalidRole = new Response(res, false, 400, "Ogiltig roll.");
    const notFound = new Response(res, false, 404, "Användaren finns inte.");
    const unauthEditOtherUser = new Response(res, false, 403, "Du har inte behörigheter till att ändra en annan användare.");
    const unauthEditOtherAdmin = new Response(res, false, 403, "Du har inte behörigheter till att ändra en annan administratör.");
    const unauthEditRoot = new Response(res, false, 403, "Du har inte behörigheter till att ändra root.");
    const success = new Response(res, true, 200, "Lyckades uppdatera användaren.");

    try {
        switch (initiator.role) {
            case "user":
                if (initiator.id !== target.id) {
                    return unauthEditOtherUser.send();
                }

                const updatedUser1 = await user.findByIdAndUpdate(target.id, {
                    $set: {
                        firstname: target.firstname,
                        lastname: target.lastname,
                        updatedBy: initiator.id
                    }
                }, { new: true, runValidators: true });

                if (!updatedUser1) {
                    return notFound.send();
                }
                return success.send({ account: updatedUser1 });
            case "admin":
                const target_account = await user.findById(target.id);

                if (target_account.role === "root") {
                    return unauthEditRoot.send();
                }

                if (target_account.role === "admin" && initiator.id !== target.id) {
                    return unauthEditOtherAdmin.send();
                }
                const updatedUser2 = await user.findByIdAndUpdate(target.id, {
                    $set: {
                        firstname: target.firstname,
                        lastname: target.lastname,
                        updatedBy: initiator.id
                    }
                }, { new: true, runValidators: true });

                if (!updatedUser2) {
                    return notFound.send();
                }
                return success.send({ account: updatedUser2 });
            case "root":
                const updatedUser3 = await user.findByIdAndUpdate(target.id, {
                    $set: {
                        firstname: target.firstname,
                        lastname: target.lastname,
                        updatedBy: initiator.id
                    }
                }, { new: true, runValidators: true });

                if (!updatedUser3) {
                    return notFound.send();
                }
                return success.send({ account: updatedUser3 });
            default:
                return invalidRole.send();
        }
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        return server.send();
    }
}

/**
 * Raderar en användare, olika roller har olika behörigheter.
 * @param {object} res 
 * @param {object} initiator - vem som utför raderingen.
 * @param {object} targetID - vem som ska raderas.
 * @returns 
 */
async function deleteUser(res, initiator, targetID) {
    // Hantering:
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const invalidRole = new Response(res, false, 400, "Ogiltig roll.");
    const notFound = new Response(res, false, 404, "Användaren finns inte.");
    const unauthDeleteOtherUser = new Response(res, false, 403, "Du har inte behörigheter till att radera en annan användare.");
    const unauthDeleteSelfOrOtherAdmin = new Response(res, false, 403, "Du har inte behörigheter till att radera ditt eller en annan administratörs konto.");
    const notPossible = new Response(res, false, 403, "Root-användaren kan inte raderas.");
    const success = new Response(res, true, 200, "Användaren raderades.");

    try {
        switch (initiator.role) {
            case "user":
                if (initiator.id !== targetID) {
                    return unauthDeleteOtherUser.send();
                }

                const deletedUser1 = await user.findByIdAndDelete(targetID);

                if (!deletedUser1) {
                    return notFound.send();
                }

                return success.send({ account: deletedUser1 });
            case "admin":
                const target = await getUser(targetID);
                if (target.role === "root") {
                    return notPossible.send();
                }

                if (target.role === "admin" && initiator.id === targetID) {
                    return unauthDeleteSelfOrOtherAdmin.send();
                }

                const deletedUser2 = await user.findByIdAndDelete(targetID);

                if (!deletedUser2) {
                    return notFound.send();
                }

                return success.send({ account: deletedUser2 });
            case "root":
                const target2 = await getUser(targetID)
                if (target2.role === "root") {
                    return notPossible.send();
                }

                const deletedUser3 = await user.findByIdAndDelete(targetID);

                if (!deletedUser3) {
                    return notFound.send();
                }

                return success.send({ account: deletedUser3 });
            default:
                return invalidRole.send();
        }
    } catch (error) {
        if (error.status === 404) {
            return notFound.send();
        }

        if (error.name = "CastError") {
            return invalidID.send();
        }
        return server.send();
    }
}

module.exports = { getProfile, getUsers, createUser, loginUser, editUser, deleteUser };