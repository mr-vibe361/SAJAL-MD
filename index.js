const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, makeInMemoryStore, jidDecode } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import config and modules
const config = require('./lib/config');
const logger = require('./utils/logger');
const { downloadMedia, isUrl, getBuffer } = require('./utils/helpers');

// Import command handlers
const adminCommands = require('./commands/admin');
const funCommands = require('./commands/fun');
const aiCommands = require('./commands/ai');
const toolsCommands = require('./commands/tools');

class SAJALMD {
    constructor() {
        this.sock = null;
        this.store = makeInMemoryStore({ logger: { warn: () => {} } });
        this.isConnected = false;
        this.ownerNumber = config.ownerNumber;
        this.prefix = config.prefix;
        this.init();
    }

    async init() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState('sessions');
            
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: logger.baileysLogger,
                browser: Browsers.macOS('Safari'),
                syncFullHistory: false,
                generateHighQualityLinkPreview: true
            });

            this.store.bind(this.sock.ev);
            this.setupEventHandlers();
            this.sock.ev.on('creds.update', saveCreds);

        } catch (error) {
            logger.error('Initialization error:', error);
            process.exit(1);
        }
    }

    setupEventHandlers() {
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                qrcode.generate(qr, { small: true });
                logger.info('Scan the QR code above to connect');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.warn(`Connection closed due to ${lastDisconnect.error}, reconnecting ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    setTimeout(() => this.init(), 3000);
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                logger.success('SAJAL MD Connected ✅');
                console.log('╔══════════════════════════════════╗');
                console.log('║       SAJAL MD CONNECTED ✅      ║');
                console.log('║    Multi-Device WhatsApp Bot     ║');
                console.log('╚══════════════════════════════════╝');
            }
        });

        this.sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;

                await this.handleMessage(msg);
            } catch (error) {
                logger.error('Message handling error:', error);
            }
        });

        this.sock.ev.on('group-participants.update', async (update) => {
            try {
                await this.handleGroupUpdate(update);
            } catch (error) {
                logger.error('Group update error:', error);
            }
        });
    }

    async handleMessage(msg) {
        const messageType = Object.keys(msg.message || {})[0];
        const text = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    msg.message?.imageMessage?.caption || '';

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        const isGroup = from.endsWith('@g.us');
        const isOwner = sender === this.ownerNumber;
        const isAdmin = isGroup ? await this.isGroupAdmin(from, sender) : false;

        // Check if message starts with prefix or is a direct message to bot
        const isCmd = text.startsWith(this.prefix) || 
                     (isGroup && text.toLowerCase().includes('sajal')) ||
                     (!isGroup && !text.startsWith(this.prefix));

        if (!isCmd) return;

        const command = text.toLowerCase().split(' ')[0].replace(this.prefix, '');
        const args = text.split(' ').slice(1);

        logger.info(`Command: ${command} from ${sender}`);

        // Handle commands
        try {
            // Admin commands
            if (adminCommands[command] && (isOwner || isAdmin)) {
                await adminCommands[command](this.sock, msg, args);
                return;
            }

            // AI commands
            if (aiCommands[command]) {
                await aiCommands[command](this.sock, msg, args);
                return;
            }

            // Fun commands
            if (funCommands[command]) {
                await funCommands[command](this.sock, msg, args);
                return;
            }

            // Tools commands
            if (toolsCommands[command]) {
                await toolsCommands[command](this.sock, msg, args);
                return;
            }

            // Auto-reply for non-command messages
            if (!text.startsWith(this.prefix)) {
                await this.handleAutoReply(msg, text);
            }

        } catch (error) {
            logger.error('Command execution error:', error);
            await this.sock.sendMessage(from, { 
                text: '❌ Error executing command. Please try again.' 
            });
        }
    }

    async handleAutoReply(msg, text) {
        const from = msg.key.remoteJid;
        
        // Simple auto-reply logic
        const responses = {
            'hi': 'Hello! 👋 How can I help you?',
            'hello': 'Hi there! 😊',
            'how are you': 'I\'m doing great! Thanks for asking. 🤖',
            'sajal': 'Yes, I\'m SAJAL MD Bot! How can I assist you?'
        };

        const response = responses[text.toLowerCase()] || 
                        'I\'m SAJAL MD Bot! Use !help to see available commands.';

        await this.sock.sendMessage(from, { text: response });
    }

    async handleGroupUpdate(update) {
        // Handle group welcome/goodbye messages
        const { id, participants, action } = update;
        
        if (action === 'add') {
            await this.sock.sendMessage(id, {
                text: `Welcome @${participants[0].split('@')[0]} to the group! 🎉`,
                mentions: participants
            });
        } else if (action === 'remove') {
            await this.sock.sendMessage(id, {
                text: `Goodbye @${participants[0].split('@')[0]}! 👋`,
                mentions: participants
            });
        }
    }

    async isGroupAdmin(groupJid, userJid) {
        try {
            const groupMetadata = await this.sock.groupMetadata(groupJid);
            const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
            return admins.includes(userJid);
        } catch (error) {
            return false;
        }
    }
}

// Start the bot
new SAJALMD();

// Handle process events
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
