import P from 'pino';
// Importar todo el módulo baileys como pkg
import pkg from 'baileys';
// Desestructurar las propiedades que necesitas del módulo
const { makeWASocket, DisconnectReason, useMultiFileAuthState, MessageType } = pkg;
import fs from 'fs';

// Cargar la configuración desde config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Obtener el número del dueño y el prefijo desde config.json
const ownerNumber = config.ownerNumber + '@s.whatsapp.net'; // Asegúrate de agregar '@s.whatsapp.net'
const prefix = config.prefix;

// Inicializar el estado de autenticación
const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_sessions');

// Función para iniciar el bot
const bot = () => {
  let sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  });

  // Guardar credenciales automáticamente
  sock.ev.on('creds.update', saveCreds);

  // Manejar la conexión
  sock.ev.on('connection.update', ({ qr, connection, lastDisconnect }) => {
    if (qr) {
      console.log('Escanee el siguiente QR con su WhatsApp actualizado.');
    }
    if (connection === 'close') {
      if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
        bot(); // Reintentar conexión
      }
    } else if (connection === 'open') {
      console.log('Bot conectado');
    }
  });

  // Escuchar mensajes entrantes
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    const content = message.message.conversation;
    const from = message.key.remoteJid;

    // Comprobar si el mensaje es un comando
    if (content.startsWith(prefix)) {
      const command = content.slice(prefix.length).toLowerCase();

      // Responder al comando /menu
      if (command === 'menu') {
        const response = 'Hola este es el menú principal';
        await sock.sendMessage(from, { text: response }, { quoted: message });
      }

      // Comandos exclusivos para el dueño del bot
      if (message.key.fromMe || from === ownerNumber) {
        if (command === 'owner') {
          const response = '> Hola este es el menú para el owner del bot \n No hay nada interesante aquí por ahora XD \n *Hecho por Salo*';
          await sock.sendMessage(from, { text: response }, { quoted: message });
        }
        // Aquí puedes agregar más comandos exclusivos para el dueño
      }
    }
  });

  return sock;
};

// Ejecutar el bot
bot();
