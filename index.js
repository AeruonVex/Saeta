// Zapallo XD 
// Hey no me robes el código me costó mucho trabajo :(

import P from 'pino';
import pkg from 'baileys';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Desestructurar las propiedades necesarias del módulo
const { makeWASocket, DisconnectReason, useMultiFileAuthState, MessageType, downloadContentFromMessage, proto } = pkg;

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

// Cargar la configuración desde config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Obtener el número del dueño y el prefijo desde config.json
const ownerNumber = config.ownerNumber + '@s.whatsapp.net';
const prefix = config.prefix;

// Inicializar el estado de autenticación
const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_sessions');

// Función para enviar una imagen con un mensaje
async function enviarImagenConMensaje(sock, jid, pathImagen, mensaje) {
  const imagen = fs.readFileSync(pathImagen); // Leer el archivo de la imagen
  await sock.sendMessage(jid, { image: imagen, caption: mensaje });
}

// Función para convertir una imagen en sticker y enviarla
async function enviarSticker(sock, jid, buffer) {
  // Crear un archivo temporal para el sticker
  const tempPath = join(tmpdir(), 'sticker.webp');

  // Escribir el buffer de la imagen en el archivo temporal
  await fs.promises.writeFile(tempPath, buffer);

  // Usar ffmpeg para convertir la imagen a formato webp
  await execAsync(`ffmpeg -i ${tempPath} -vcodec libwebp -filter:v fps=fps=10 ${tempPath}`);

  // Leer el sticker desde el archivo temporal
  const stickerStream = createReadStream(tempPath);

  // Enviar el sticker
  await pipelineAsync(
    stickerStream,
    sock.sendMessage(jid, { sticker: stickerStream })
  );

  // Eliminar el archivo temporal
  await fs.promises.unlink(tempPath);
}

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

      // Reaccionar al mensaje para indicar que el comando ha sido detectado
      await sock.sendMessage(from, { react: { text: '✔', key: message.key } });

      // Menú 
      if (command === 'menu') {
        const pathImagen = './images/menu.jpg'; 
        const mensaje = '> Hola este es el menú principal \n\nNo hay nada interesante aquí por ahora XD \nEstamos en desarrollo :D \n\n\n *By Kocmoc*';
        await enviarImagenConMensaje(sock, from, pathImagen, mensaje);
      }

      // Comando para crear stickers
      if (command === 's' && message.message.imageMessage) {
        const mediaMessage = message.message.imageMessage;
        const stream = await downloadContentFromMessage(mediaMessage, 'image');
        const buffer = [];
        for await (const chunk of stream) {
          buffer.push(chunk);
        }
        const imageBuffer = Buffer.concat(buffer);
        await enviarSticker(sock, from, imageBuffer);
      }

      // owner
      if (message.key.fromMe || from === ownerNumber) {
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

