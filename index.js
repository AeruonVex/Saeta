import P from 'pino';
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from 'baileys';

// Número del dueño del bot (debe ser un número de teléfono completo en formato internacional)
const ownerNumber = '1234567890'; // Reemplaza con tu número

// Inicializar el estado de autenticación
const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_sessions');

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
    if (content.startsWith('/')) {
      const command = content.slice(1).toLowerCase();

      // Responder al coma
