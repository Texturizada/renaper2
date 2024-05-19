const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const logChatId = '6706461325';
const allowedGroupId = -1002108829060;
const unlimitedUserId = 6706461325;
const dailyLimit = 15;

let userQueries = {};

// Cargar datos de consultas desde un archivo JSON (si existe)
if (fs.existsSync('./userQueries.json')) {
    userQueries = JSON.parse(fs.readFileSync('./userQueries.json'));
}

// Guardar datos de consultas en un archivo JSON
function saveUserQueries() {
    fs.writeFileSync('./userQueries.json', JSON.stringify(userQueries, null, 2));
}

// Resetear el conteo de consultas diariamente
function resetDailyCounts() {
    userQueries = {};
    saveUserQueries();
}

// Configurar un reset diario a medianoche
const now = new Date();
const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
setTimeout(function() {
    resetDailyCounts();
    setInterval(resetDailyCounts, 24 * 60 * 60 * 1000);
}, msUntilMidnight);

// Función para verificar si el comando se está usando en el grupo permitido
function checkAllowedChat(ctx) {
    const chatId = ctx.chat.id;
    return chatId === allowedGroupId;
}

// Función para verificar y actualizar el límite de consultas del usuario
function checkUserLimit(ctx) {
    const userId = ctx.from.id;

    // Consultas ilimitadas para el usuario específico
    if (userId === unlimitedUserId) {
        return true;
    }

    // Inicializar el conteo de consultas si no existe
    if (!userQueries[userId]) {
        userQueries[userId] = 0;
    }

    // Verificar si el usuario ha alcanzado el límite diario
    if (userQueries[userId] >= dailyLimit) {
        return false;
    }

    // Incrementar el conteo de consultas
    userQueries[userId]++;
    saveUserQueries();
    return true;
}

function getUserRemainingQueries(ctx) {
    const userId = ctx.from.id;

    // Consultas ilimitadas para el usuario específico
    if (userId === unlimitedUserId) {
        return 'Ilimitadas';
    }

    // Inicializar el conteo de consultas si no existe
    if (!userQueries[userId]) {
        userQueries[userId] = 0;
    }

    return dailyLimit - userQueries[userId];
}

function ban(ctx) {
    if (!checkAllowedChat(ctx)) {
        ctx.reply("No estás autorizado para usar este comando en este chat.");
        return;
    }

    if (!checkUserLimit(ctx)) {
        ctx.reply(`Has alcanzado el límite de consultas diarias.`);
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
    .then(() => {
        const remainingQueries = getUserRemainingQueries(ctx);
        ctx.reply(`Número eliminado exitosamente. Consultas diarias restantes: ${remainingQueries}.`);
    })
    .catch(() => ctx.reply('Ocurrió un error al intentar eliminar el número.'));
}

function renaper(ctx) {
    if (!checkAllowedChat(ctx)) {
        ctx.reply("No estás autorizado para usar este comando en este chat.");
        return;
    }

    if (!checkUserLimit(ctx)) {
        ctx.reply(`Has alcanzado el límite de consultas diarias.`);
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
            const remainingQueries = getUserRemainingQueries(ctx);
            ctx.replyWithMarkdown(`${message}\n\nConsultas diarias restantes: ${remainingQueries}.`);
        } else {
            ctx.reply("Hubo un error al obtener los datos personales.");
        }
    })
    .catch(error => {
        console.error(`Error interno del servidor: ${error.message}`);
        ctx.reply(`Error interno del servidor: ${error.message}`);
    });
}

function menu(ctx) {
    if (!checkAllowedChat(ctx)) {
        ctx.reply("No estás autorizado para usar este comando en este chat.");
        return;
    }

    ctx.reply(
        "BOT ACTIVO 24/7\n" +
        "-----------------------------\n" +
        "• Comandos:\n" +
        "  /dni [DNI] [M/F] - Consulta por DNI\n" +
        "  /nombre [Nombre/Razón Social] - Búsqueda por Nombre/Razón Social\n" +
        "  /ban {ddi} {number} - Eliminar un número de WhatsApp\n" +
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

    if (!checkUserLimit(ctx)) {
        ctx.reply(`Has alcanzado el límite de consultas diarias.`);
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
        if (response.data.HayError) {
            return ctx.reply('Hubo un error al realizar la búsqueda.');
        }

        if (response.data.EntidadesEncontradas && response.data.EntidadesEncontradas.length > 0) {
            let message = "Resultados encontrados:\n";
            response.data.EntidadesEncontradas.forEach(entidad => {
                message += `\nDocumento: ${entidad.Documento}\n`;
                message += `Razón Social: ${entidad.RazonSocial}\n`;
                message += `Actividad: ${entidad.Actividad}\n`;
                message += `Provincia: ${entidad.Provincia}\n`;
                message += `Url: ${entidad.UrlInforme}\n`;
            });

            const remainingQueries = getUserRemainingQueries(ctx);
            message += `\nConsultas diarias restantes: ${remainingQueries}.`;

            ctx.reply(message);
        } else {
            ctx.reply('No se encontraron resultados.');
        }
    })
    .catch(error => {
        console.error(`Error interno del servidor: ${error.message}`);
        ctx.reply(`Error interno del servidor: ${error.message}`);
    });
}

const bot = new Telegraf('6570754843:AAE2qqsZCp5sEQ3iHygzhHdncOokcB4T8bU');
bot.start(ctx => ctx.reply('Bienvenido al bot de consultas.'));
bot.command('menu', menu);
bot.command('ban', ban);
bot.command('renaper', renaper);
bot.command('nombre', buscarNombre);

bot.launch({
    webhook: {
        domain: 'https://api-ricardo-whatsapp.onrender.com',
        port: 3000
    }
});
