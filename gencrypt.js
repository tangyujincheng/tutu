
require('dotenv').config();
const { encrypt } = require('./backend/utils/crypto');

const apiKey = '24590a27-89c2-4cb2-b302-b3355dada1d7';
const encrypted = encrypt(apiKey);
console.log('Encrypted API Key:', encrypted);
