# SAJAL-MD
A POWERFUL WHATTSAP BOT BY MR.VIBE
# SAJAL MD - WhatsApp Multi-Device Bot

A feature-rich WhatsApp bot built with Baileys MD with AI capabilities.

## Features
- 🤖 OpenAI GPT-4 & DALL-E integration
- 📷 Sticker maker
- 🎥 YouTube downloader
- 👥 Group management
- 🎮 Fun commands
- 🔗 Anti-link system

## Setup Instructions

### Prerequisites
- Node.js 16+
- FFmpeg (for media processing)
- OpenAI API key

### Termux Setup
```bash
pkg update && pkg upgrade
pkg install nodejs ffmpeg -y
git clone https://github.com/yourusername/sajal-md-bot.git
cd sajal-md-bot
npm install
cp .env.example .env
# Edit .env with your details
npm start
