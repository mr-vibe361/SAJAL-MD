const { OpenAI } = require('openai');
const config = require('../lib/config');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: config.openaiApiKey });

module.exports = {
    async ai(sock, msg, args) {
        const from = msg.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(from, { 
                text: 'Please provide a prompt after !ai command' 
            });
        }

        try {
            await sock.sendMessage(from, { text: '🤖 Thinking...' });
            
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: text }],
                max_tokens: 1000
            });

            await sock.sendMessage(from, { 
                text: response.choices[0].message.content 
            });
        } catch (error) {
            logger.error('AI error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Error generating AI response' 
            });
        }
    },

    async dalle(sock, msg, args) {
        const from = msg.key.remoteJid;
        const prompt = args.join(' ');

        if (!prompt) {
            return await sock.sendMessage(from, { 
                text: 'Please provide a prompt after !dalle command' 
            });
        }

        try {
            await sock.sendMessage(from, { text: '🎨 Generating image...' });
            
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            });

            const imageUrl = response.data[0].url;
            await sock.sendMessage(from, {
                image: { url: imageUrl },
                caption: `Generated image for: ${prompt}`
            });
        } catch (error) {
            logger.error('DALL-E error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Error generating image' 
            });
        }
    }
};
