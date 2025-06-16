const user = require("../models/user");
const bcrypt = require('bcrypt');
const { generateToken } = require("./token");
const Response = require("./response");
const { getReviewsByUser } = require("./review");
const review = require("../models/review");
const dayjs = require('dayjs');


/**
 * Kollar om användaren är inloggad.
 * @param {object} res 
 * @param {string} userID - användarid.
 * @returns 
 */
async function isUserLoggedIn(res, userID) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const notFound = new Response(res, false, 404, "Användaren finns inte.");
    const success = new Response(res, true, 200, "Användaren är inloggad och korrekt.");

    try {
        const cUser = await user.findById(userID);

        if (!cUser) {
            return notFound.send();
        }
        const formatted = {
            id: cUser._id,
            firstname: cUser.firstname,
            lastname: cUser.lastname,
            registered: dayjs(cUser.createdAt).format("YYYY-MM-DD HH:mm"),
            role: cUser.role
        }
        return success.send({ account: formatted });
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        console.error(error);
        return server.send();
    }
}

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
    const success = new Response(res, true, 200, "Lyckades hämta profil.");

    try {
        // Kontrollerar att vanliga inloggade användare endast kan se sin egen profil oavsett query, men admin och root kan använda query för att se andra användares profiler.
        if (initiator.role === 'user') {
            target.id = initiator.id;
        } else if (!target.id) {
            target.id = initiator.id;
        }

        const account = await getUser(target.id);

        const formatted = {
            id: account._id,
            firstname: account.firstname,
            lastname: account.lastname,
            email: account.email,
            role: account.role,
            registered: dayjs(account.createdAt).format("YYYY-MM-DD HH:mm")
        };

        const reviews_section = await getReviewsByUser(target.id, true, target.page, target.limit);

        // const allReviews = await getReviewsByUser(target.id, false);



        success.send({ account: formatted, reviews_section });
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
 * Hämtar användare beroende på query.
 * @param {object} res 
 * @param {object} param1 - query som filtrerar och paginerar.
 * @returns 
 */
async function getUsers(res, { roles, name, page = 1, limit = 10 }) {
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const success = new Response(res, true, 201, "Lyckades hämta användare.");
    try {
        page = parseInt(page);
        limit = parseInt(limit);

        // Följande kod är för att kunna söka name på både för- och efternamn.
        name = name?.trim().replace(/\s+/, ' ') || "";

        const pipeline = [];

        if (name) {
            // Skapar ett fält för både förnamn och efternamn.
            pipeline.push({
                $addFields: {
                    fullname: { $concat: ["$firstname", " ", "$lastname"] }
                }
            });

            // Gör en matchning mellan namn och fullname.
            pipeline.push({
                $match: {
                    fullname: { $regex: name, $options: 'i' }
                }
            });
        }
        if (roles) {
            // Gör en matchning mellan roller.
            pipeline.push({
                $match: {
                    role: { $in: roles.split(',') }
                }
            });
        }

        const skip = (page - 1) * limit;

        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        const result = await user.aggregate(pipeline).sort({ createdAt: -1 }); // Sorterad senast först.
        const formatted = result.map(r => ({
            id: r._id,
            firstname: r.firstname,
            lastname: r.lastname,
            email: r.email,
            role: r.role,
            registered: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
            edited: dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")
        }));

        // Gör massa beräkningar för paginering.
        const countPipeline = pipeline.filter(stage => !('$skip' in stage || '$limit' in stage));
        countPipeline.push({ $count: 'total' });

        const countResult = await user.aggregate(countPipeline);
        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        const pagination = { totalItems, totalPages, currentPage: page, pageSize: limit };
        return success.send({ pagination, users: formatted });
    } catch (error) {
        if (error.name === "CastError") {
            return invalidID.send();
        }
        console.error(error);
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
    const notFound = new Response(res, false, 400, "E-Post address eller lösenord är felaktig.");
    const success = new Response(res, true, 200, "Inloggningen lyckades.");

    try {
        const account = await user.findOne({ email });
        if (!account) {
            return notFound.send();
        }
        const match = await bcrypt.compare(password, account.password);
        if (match) {
            const token = generateToken(account);
            const formatted = {
                id: account._id,
                firstname: account.firstname,
                lastname: account.lastname,
                registered: dayjs(account.createdAt).format("YYYY-MM-DD HH:mm"),
                role: account.role
            }
            return success.send({ token, account: formatted });
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
async function editUser(res, initiator, targetID, body) {
    // Hantering:
    const server = new Response(res, false, 500, "Ett serverfel inträffade.");
    const invalidID = new Response(res, false, 400, "Ogiltigt ID-format.");
    const invalidRole = new Response(res, false, 400, "Ogiltig roll.");
    const notFound = new Response(res, false, 404, "Användaren finns inte.");
    const unauthEditOtherUser = new Response(res, false, 403, "Du har inte behörigheter till att ändra en annan användare.");
    const unauthEditOtherAdmin = new Response(res, false, 403, "Du har inte behörigheter till att ändra en annan administratör.");
    const unauthEditRoot = new Response(res, false, 403, "Du har inte behörigheter till att ändra root.");
    const conflict = new Response(res, false, 409, "E-Post addressen är redan registrerad.");
    // Alltså, detta händer bara om man är inloggad och ska ändra sin användare. Och det är ologiskt att e-post addressen är fel för lösenordet.
    // Men det kan bara vara jag som har tänkt konstigt.
    const input = new Response(res, false, 400, "Lösenord är felaktig.");
    const success = new Response(res, true, 200, "Lyckades uppdatera användaren.");

    try {
        switch (initiator.role) {
            case "user":
                if (initiator.id !== targetID) {
                    return unauthEditOtherUser.send();
                }

                const target_account2 = await user.findById(targetID);

                if (initiator.id === targetID && body.email && body.currentPassword) {
                    const match = await bcrypt.compare(body.currentPassword, target_account2.password);
                    if (match) {
                        const updateUserCompletely = await user.findByIdAndUpdate(targetID, {
                            $set: {
                                firstname: body.firstname,
                                lastname: body.lastname,
                                email: body.email,
                                updatedBy: initiator.id
                            }
                        }, { new: true, runValidators: true });

                        if (!updateUserCompletely) {
                            return notFound.send();
                        }

                        const formatted3 = {
                            id: updateUserCompletely._id,
                            firstname: updateUserCompletely.firstname,
                            lastname: updateUserCompletely.lastname,
                            email: updateUserCompletely.email,
                            registered: dayjs(updateUserCompletely.createdAt).format("YYYY-MM-DD HH:mm")
                        }
                        return success.send({ account: formatted3 });
                    } else {
                        return input.send();
                    }
                }

            case "admin":
                const target_account = await user.findById(targetID);

                if (target_account.role === "root") {
                    return unauthEditRoot.send();
                }

                if (target_account.role === "admin" && initiator.id !== targetID) {
                    return unauthEditOtherAdmin.send();
                }

                if (initiator.id === targetID && body.email && body.currentPassword) {

                    const match = await bcrypt.compare(body.currentPassword, target_account.password);
                    if (match) {
                        const updateUserCompletely = await user.findByIdAndUpdate(targetID, {
                            $set: {
                                firstname: body.firstname,
                                lastname: body.lastname,
                                email: body.email,
                                updatedBy: initiator.id
                            }
                        }, { new: true, runValidators: true });

                        if (!updateUserCompletely) {
                            return notFound.send();
                        }
                        const formatted3 = {
                            id: updateUserCompletely._id,
                            firstname: updateUserCompletely.firstname,
                            lastname: updateUserCompletely.lastname,
                            email: updateUserCompletely.email,
                            registered: dayjs(updateUserCompletely.createdAt).format("YYYY-MM-DD HH:mm")
                        }
                        return success.send({ account: formatted3 });
                    } else {
                        return input.send();
                    }
                }

                const updatedUser2 = await user.findByIdAndUpdate(targetID, {
                    $set: {
                        firstname: body.firstname,
                        lastname: body.lastname,
                        updatedBy: initiator.id
                    }
                }, { new: true, runValidators: true });

                if (!updatedUser2) {
                    return notFound.send();
                }

                const formatted2 = {
                    id: updatedUser2._id,
                    firstname: updatedUser2.firstname,
                    lastname: updatedUser2.lastname,
                    email: updatedUser2.email,
                    registered: dayjs(updatedUser2.createdAt).format("YYYY-MM-DD HH:mm")
                }
                return success.send({ account: formatted2 });
            case "root":
                const target_account3 = await user.findById(targetID);

                if (initiator.id === targetID && body.email && body.currentPassword) {
                    const match = await bcrypt.compare(body.currentPassword, target_account3.password);
                    if (match) {
                        const updateUserCompletely = await user.findByIdAndUpdate(targetID, {
                            $set: {
                                firstname: body.firstname,
                                lastname: body.lastname,
                                email: body.email,
                                updatedBy: initiator.id
                            }
                        }, { new: true, runValidators: true });

                        if (!updateUserCompletely) {
                            return notFound.send();
                        }

                        const formatted3 = {
                            id: updateUserCompletely._id,
                            firstname: updateUserCompletely.firstname,
                            lastname: updateUserCompletely.lastname,
                            email: updateUserCompletely.email,
                            registered: dayjs(updateUserCompletely.createdAt).format("YYYY-MM-DD HH:mm")
                        }
                        return success.send({ account: formatted3 });
                    } else {
                        return input.send();
                    }
                }
                const updatedUser3 = await user.findByIdAndUpdate(targetID, {
                    $set: {
                        firstname: body.firstname,
                        lastname: body.lastname,
                        updatedBy: initiator.id
                    }
                }, { new: true, runValidators: true });

                if (!updatedUser3) {
                    return notFound.send();
                }
                const formatted3 = {
                    id: updatedUser3._id,
                    firstname: updatedUser3.firstname,
                    lastname: updatedUser3.lastname,
                    email: updatedUser3.email,
                    registered: dayjs(updatedUser3.createdAt).format("YYYY-MM-DD HH:mm")
                }
                return success.send({ account: formatted3 });
            default:
                return invalidRole.send();
        }
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
                const deletedUser1Reviews = await getReviewsByUser(targetID);

                deletedUser1Reviews.forEach(async deletereview => {
                    await review.findByIdAndDelete(deletereview._id);
                });
                return success.send();
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

                const deletedUser2Reviews = await getReviewsByUser(targetID);

                deletedUser2Reviews.forEach(async deletereview => {
                    await review.findByIdAndDelete(deletereview._id);
                });

                return success.send();
            case "root":
                const target2 = await getUser(targetID)
                if (target2.role === "root") {
                    return notPossible.send();
                }

                const deletedUser3 = await user.findByIdAndDelete(targetID);

                if (!deletedUser3) {
                    return notFound.send();
                }
                const deletedUser3Reviews = await getReviewsByUser(targetID);

                deletedUser3Reviews.forEach(async deletereview => {
                    await review.findByIdAndDelete(deletereview._id);
                });

                return success.send();
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

module.exports = { isUserLoggedIn, getProfile, getUsers, createUser, loginUser, editUser, deleteUser };