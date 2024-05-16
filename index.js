// Zapallo XD 
// Hey no me robes el código me costó mucho trabajo :(

import P from 'pino';
// Importar todo el módulo baileys como pkg
import pkg from 'baileys';
// Desestructurar las propiedades necesarias del módulo
const { makeWASocket, DisconnectReason, useMultiFileAuthState, MessageType } = pkg;
import fs from 'fs';

// Cargar la configuración desde config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Obtener el número del dueño y el prefijo desde config.json
const ownerNumber = config.ownerNumber + '@s.whatsapp.net';
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

// Función para enviar una imagen con un mensaje
async function enviarImagenConMensaje(sock, jid, pathImagen, mensaje) {
  const imagen = fs.readFileSync(pathImagen); // Leer el archivo de la imagen

  // Enviar la imagen con el mensaje
  await sock.sendMessage(jid, { image: imagen, caption: mensaje });
}

// Escuchar mensajes entrantes
sock.ev.on('messages.upsert', async (m) => {
  const message = m.messages[0];
  const content = message.message.conversation;
  const from = message.key.remoteJid;

  // Comprobar si el mensaje es un comando
  if (content.startsWith(prefix)) {
    const command = content.slice(prefix.length).toLowerCase();

    // Menú 
    if (command === 'menu') {
      const pathImagen = './images/menu.jpg'; 
      const mensaje = '> Hola este es el menú principal \n\nNo hay nada interesante aquí por ahora XD \nEstamos en desarrollo :D \n\n\n *By Kocmoc*';
      await enviarImagenConMensaje(sock, from, pathImagen, mensaje);
    }

    // owner
    if (message.key.fromMe || from === ownerNumber + '@s.whatsapp.net') {
      if (command === 'owner') {
        const response = 'Hola este es el menú para el owner del bot';
        await sock.sendMessage(from, { text: response }, { quoted: message });
      }
      // futuro
    }
  }
});


  return sock;
};

// Ejecutar el bot
bot();
