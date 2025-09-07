const config = require('../lib/config');

module.exports = {
    async promote(sock, msg, args) {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        const participant = args[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!participant) return;

        try {
            await sock.groupParticipantsUpdate(from, [participant], 'promote');
            await sock.sendMessage(from, { text: `✅ Promoted @${participant.split('@')[0]}` });
        } catch (error) {
            await sock.sendMessage(from, { text: '❌ Failed to promote user' });
        }
    },

    async demote(sock, msg, args) {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        const participant = args[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!participant) return;

        try {
            await sock.groupParticipantsUpdate(from, [participant], 'demote');
            await sock.sendMessage(from, { text: `✅ Demoted @${participant.split('@')[0]}` });
        } catch (error) {
            await sock.sendMessage(from, { text: '❌ Failed to demote user' });
        }
    },

    async kick(sock, msg, args) {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        const participant = args[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!participant) return;

        try {
            await sock.groupParticipantsUpdate(from, [participant], 'remove');
            await sock.sendMessage(from, { text: `✅ Kicked @${participant.split('@')[0]}` });
        } catch (error) {
            await sock.sendMessage(from, { text: '❌ Failed to kick user' });
        }
    }
};
