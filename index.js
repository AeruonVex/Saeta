// Importar la librería de Baileys
const { makeWASocket, MessageType } = require('@whiskeysockets/baileys');

// Número del dueño del bot (debe ser un número de teléfono completo en formato internacional)
const ownerNumber = '+19299996333';

// Iniciar el bot de WhatsApp
const startBot = () => {
  const sock = makeWASocket({
    // Opciones de configuración aquí
  });

  // Escuchar los mensajes entrantes
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    const content = message.message.conversation;
    const from = message.key.remoteJid;

    // Comprobar si el mensaje es un comando
    if (content.startsWith('/')) {
      const command = content.slice(1).toLowerCase();

      // Responder al comando /menu
      if (command === 'menu') {
        const response = 'Hola este es el menú principal';
        await sock.sendMessage(from, { text: response }, { quoted: message });
      }

      // Comandos exclusivos para el dueño del bot
      if (message.key.fromMe || from === ownerNumber) {
        if (command === 'owner') {
          const response = 'Hola este es el menú para el owner del bot';
          await sock.sendMessage(from, { text: response }, { quoted: message });
        }
        // Aquí puedes agregar más comandos exclusivos para el dueño
      }
    }
  });

  // Manejar la desconexión
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      // Intentar reconectar
      startBot();
    }
  });
};

// Ejecutar el bot
startBot();
