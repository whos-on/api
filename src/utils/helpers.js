const bcrypt = require("bcryptjs")

function hashPassword(password) {
    const salt = bcrypt.genSaltSync()
    return bcrypt.hashSync(password, salt)
}

function comparePassword(raw, hash) {
    return bcrypt.compareSync(raw, hash)
}

const jsonToUrlEncoded = o =>
    Object.keys(o)
        .map(k => `${ encodeURIComponent(k) }=${ encodeURIComponent(o[k]) }`).
        join('&')

module.exports = { hashPassword, comparePassword, jsonToUrlEncoded }
