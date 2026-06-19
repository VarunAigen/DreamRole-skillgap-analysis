require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    try {
        const res = await axios.get(url);
        console.log('Success listing models!');
        const models = res.data.models || [];
        console.log('Found', models.length, 'models.');
        models.slice(0, 10).forEach(m => console.log('-', m.name, m.supportedGenerationMethods));
    } catch (err) {
        console.log('Failed listing models! Status:', err.response?.status);
        console.log('Details:', JSON.stringify(err.response?.data, null, 2) || err.message);
    }
}

listModels();
