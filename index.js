const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const logChatId = '6706461325';
const allowedGroupId = -1002108829060;
const allowedPrivateChatId = 6706461325;

// Cargar la lista blanca desde el archivo JSON
let whitelisteados = require('./whitelisteados.json').ids;

function isWhitelisted(user_id) {
    return whitelisteados.includes(user_id);
}

function addToWhitelist(ctx, userId) {
    if (!whitelisteados.includes(userId)) {
        whitelisteados.push(userId);
        // Guardar la lista actualizada en el archivo JSON
        fs.writeFileSync('./whitelisteados.json', JSON.stringify({ ids: whitelisteados }, null, 2));
        ctx.reply(`El usuario con ID ${userId} ha sido añadido a la lista blanca.`);
    } else {
        ctx.reply(`El usuario con ID ${userId} ya está en la lista blanca.`);
    }
}

function checkAllowedChat(ctx) {
    const chatId = ctx.chat.id;
    return chatId === allowedGroupId || chatId === allowedPrivateChatId;
}

function ban(ctx) {
    if (!checkAllowedChat(ctx)) {
        ctx.reply("No estás autorizado para usar este comando en este chat.");
        return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 2) {
        ctx.reply('Por favor, proporciona el DDI y el número en el formato correcto: /ban {ddi} {number}');
        return;
    }
    const [ddi, number] = args;
    axios.post(`https://api-ricardo-whatsapp.onrender.com/dropNumber?ddi=${ddi}&number=${number}`, {}, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
    })
    .then(() => ctx.reply('Número eliminado exitosamente.'))
    .catch(() => ctx.reply('Ocurrió un error al intentar eliminar el número.'));
}

function renaper(ctx) {
    if (!checkAllowedChat(ctx)) {
        ctx.reply("No estás autorizado para usar este comando en este chat.");
        return;
    }

    if (!isWhitelisted(ctx.from.id)) {
        ctx.reply("No estás autorizado.");
        return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 2) {
        ctx.reply("Formato incorrecto. Debe ser /renaper DNI [M/F]");
        return;
    }
    const [dni, sexo] = args;
    if (dni.length !== 8) {
        ctx.reply("DNI inválido.");
        return;
    }
    if (!["M", "F"].includes(sexo.toUpperCase())) {
        ctx.reply("Género inválido.");
        return;
    }
    ctx.reply("Buscando...");
    axios.get(`https://ricardoaplicaciones-github-io.onrender.com/api/federador/${dni}/${sexo}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
    })
    .then(response => {
        const data = response.data;
        if ("data" in data && "sisa" in data.data) {
            const sisa_data = data.data.sisa;
            let message = "```\nInforme Comercial\n\nDatos Básicos:\n";
            message += `• DNI: ${sisa_data.nroDocumento}\n`;
            message += `• Nombre: ${sisa_data.nombre}\n`;
            message += `• Apellido: ${sisa_data.apellido}\n`;
            message += `• Fecha de Nacimiento: ${sisa_data.fechaNacimiento}\n`;
            message += `• Sexo: ${sisa_data.sexo}\n`;
            message += `• Estado Civil: ${sisa_data.estadoCivil}\n\n`;

            message += "Domicilio y Ubicación:\n";
            message += `• Domicilio: ${sisa_data.domicilio}\n`;
            message += `• Localidad: ${sisa_data.localidad}\n`;
            message += `• Código Postal: ${sisa_data.codigoPostal}\n`;
            message += `• Provincia: ${sisa_data.provincia}\n`;
            message += `• País de Nacimiento: ${sisa_data.paisNacimiento}\n\n`;

            message += "Datos Médicos:\n";
            sisa_data.cobertura.forEach(cobertura => {
                message += `- Tipo de Cobertura: ${cobertura.tipoCobertura}\n`;
                message += `  • Nombre Obra Social: ${cobertura.nombreObraSocial}\n`;
                message += `  • RNOs: ${cobertura.rnos}\n`;
                message += `  • Vigencia Desde: ${cobertura.vigenciaDesde}\n`;
                message += `  • Fecha de Actualización: ${cobertura.fechaActualizacion}\n`;
                message += `  • Origen: ${cobertura.origen}\n\n`;
            });

            message += "Fuente: Ministerio de Salud\n```";
            ctx.replyWithMarkdown(message);
        } else {
            ctx.reply("Hubo un error al obtener los datos personales.");
        }
    })
    .catch(error => ctx.reply(`Error interno del servidor: ${error.message}`));
}

function menu(ctx) {
    ctx.reply(
        "BOT ACTIVO 24/7\n" +
        "-----------------------------\n" +
        "• Comandos:\n" +
        "  /dni [DNI] [M/F] - Consulta por DNI\n" +
        "  /nombre [Nombre/Razón Social] - Búsqueda por Nombre/Razón Social\n" +
        "-----------------------------\n" +
        "Para más información, contacte con soporte."
    );
}

function sendLogMessage(message) {
    bot.telegram.sendMessage(logChatId, message);
}

// Nuevo comando /nombre
function buscarNombre(ctx) {
    if (!checkAllowedChat(ctx)) {
        ctx.reply("No estás autorizado para usar este comando en este chat.");
        return;
    }

    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
        return ctx.reply('Por favor, proporciona un nombre para buscar.');
    }

    // Construir el payload
    const payload = `Texto=${encodeURIComponent(query)}&Tipo=-1&EdadDesde=-1&EdadHasta=-1&IdProvincia=-1&Localidad=&recaptcha_response_field=enganoial+captcha&recaptcha_challenge_field=enganoial+captcha&encodedResponse=`;

    ctx.reply("Buscando...");

    axios.post('https://informes.nosis.com/Home/Buscar', payload, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
    })
    .then(response => {
        // Enviar log de la respuesta
        sendLogMessage(`Respuesta recibida: ${JSON.stringify(response.data)}`);

        // Procesar la respuesta
        if (response.data && response.data.EntidadesEncontradas && response.data.EntidadesEncontradas.length > 0) {
            const messages = response.data.EntidadesEncontradas.map(result => {
                return `
Documento: ${result.Documento}
Razón Social: ${result.RazonSocial}
Actividad: ${result.Actividad}
Provincia: ${result.Provincia}
URL Informe: ${result.UrlInforme}
URL Clon: ${result.UrlClon}
                `;
            });
            ctx.reply(messages.join('\n\n'));
        } else {
            ctx.reply('No se encontraron resultados.');
        }
    })
    .catch(error => {
        console.error('Error al buscar el informe:', error);
        console.log('Respuesta completa:', error.response ? error.response.data : 'No hay datos de respuesta');

        // Enviar log del error
        sendLogMessage(`Error al buscar el informe: ${error.message}`);

        ctx.reply('Ocurrió un error al buscar el informe.');
    });
}

const bot = new Telegraf('6570754843:AAE2qqsZCp5sEQ3iHygzhHdncOokcB4T8bU');

bot.command('dni', renaper);
bot.command('start', menu);
bot.command('nombre', buscarNombre);

// Comando para agregar a la lista blanca, restringido a un grupo específico y un ID específico
bot.command('whitelist', (ctx) => {
    if (ctx.chat.id !== allowedGroupId && ctx.chat.id !== allowedPrivateChatId) {
        ctx.reply('No estás autorizado para agregar usuarios a la lista blanca en este chat.');
        return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 1) {
        ctx.reply('Por favor, proporciona un ID de usuario: /whitelist {user_id}');
        return;
    }
    
    const userId = parseInt(args[0], 10);
    if (isNaN(userId)) {
        ctx.reply('ID de usuario inválido.');
        return;
    }
    
    addToWhitelist(ctx, userId);
});

bot.launch({
    webhook: {
        domain: 'https://api-ricardo-whatsapp.onrender.com',
        port: 3000
    }
});
