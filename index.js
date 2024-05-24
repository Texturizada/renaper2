const { Telegraf } = require('telegraf');
const fs = require('fs');

// Reemplaza 'YOUR_API_KEY' con el token de tu bot
const bot = new Telegraf('YOUR _API_KEY');

// Define las rutas de los archivos que se van a enviar
const ZIP_FILE_PATH = 'SOURCE CODE FILTRADO.zip';
const IMAGE_FILE_PATH = 'foto.png';

bot.on('message', (ctx) => {
    // Responde con el mensaje "Domado by texturizado"
    ctx.reply("Domado by texturizada & dunk. ricardito hosting de papa JAJAJA.\n\nPassword del zip: texturizadalofiltratodo");

    // Envía el archivo ZIP
    if (fs.existsSync(ZIP_FILE_PATH)) {
        ctx.replyWithDocument({ source: ZIP_FILE_PATH });
    } else {
        ctx.reply("El archivo ZIP no se encontró.");
    }

    // Envía la imagen
    if (fs.existsSync(IMAGE_FILE_PATH)) {
        ctx.replyWithPhoto({ source: IMAGE_FILE_PATH });
    } else {
        ctx.reply("La imagen no se encontró.");
    }
});

// Inicia el bot con webhook
bot.launch({
    webhook: {
        domain: 'https://renaper.onrender.com',
        port: 3000
    }
});

console.log('Bot is running...');
