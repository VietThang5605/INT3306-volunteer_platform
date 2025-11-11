const crypto = require('crypto');

function genToken(len=64){ return crypto.randomBytes(len).toString('hex'); }
function hashToken(token){ return crypto.createHash('sha256').update(token).digest('hex'); }

module.exports = { genToken, hashToken };
