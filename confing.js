require('dotenv').config();

module.exports = {
    ownerNumber: process.env.OWNER_NUMBER + '@s.whatsapp.net',
    openaiApiKey: process.env.OPENAI_API_KEY,
    prefix: process.env.PREFIX || '.',
    sessionName: process.env.SESSION_NAME || 'SAJAL_MD',
    timezone: process.env.TIMEZONE || 'Asia/Mumbai',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50
};
