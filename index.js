 import P from 'pino';
import pkg from 'baileys';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { tmpdir } from 'os';
import { join } from 'path';
import fetch from 'node-fetch';
import { Sticker } from 'wa-sticker-formatter';
import crypto from 'crypto';
import { spawn } from 'child_process';
import webp from 'node-webpmux';
import fileTypePkg from 'file-type';

// Desestructurar las propiedades necesarias del módulo
const { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadContentFromMessage } = pkg;
const { fileTypeFromBuffer } = fileTypePkg;

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

// Log para verificar que se ejecuta el script
console.log("Script iniciado");

// Cargar la configuración desde config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
console.log("Configuración cargada", config);

// Obtener el número del dueño y el prefijo desde config.json
const ownerNumber = config.ownerNumber + '@s.whatsapp.net';
const prefix = config.prefix;

// Inicializar el estado de autenticación
const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_sessions');
console.log("Estado de autenticación inicializado");

// Función para enviar una imagen con un mensaje
async function enviarImagenConMensaje(sock, jid, pathImagen, mensaje) {
    const imagen = fs.readFileSync(pathImagen); // Leer el archivo de la imagen
    await sock.sendMessage(jid, { image: imagen, caption: mensaje });
}

// Función para crear stickers
async function sticker5(img, url, packname, author, categories = [''], extra = {}) {
    const stickerMetadata = {
        type: 'default',
        pack: packname,
        author,
        categories,
        ...extra
    };
    return (new Sticker(img ? img : url, stickerMetadata)).toBuffer();
}

async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
    const { Image } = webp;
    const img = new Image();
    const stickerPackId = crypto.randomBytes(32).toString('hex');
    const json = { 'sticker-pack-id': stickerPackId, 'sticker-pack-name': packname, 'sticker-pack-publisher': author, 'emojis': categories, ...extra };
    let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    let exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

async function sticker(img, url, ...args) {
    let lastError, stiker;
    for (let func of [sticker5].filter(f => f)) {
        try {
            stiker = await func(img, url, ...args);
            if (stiker.includes('html')) continue;
            if (stiker.includes('WEBP')) {
                try {
                    return await addExif(stiker, ...args);
                } catch (e) {
                    console.error(e);
                    return stiker;
                }
            }
            throw stiker.toString();
        } catch (err) {
            lastError = err;
            continue;
        }
    }
    console.error(lastError);
    return lastError;
}

// Función para convertir stream a buffer
async function bufferToArray(buffer) {
    let chunks = [];
    for await (let chunk of buffer) {
        chunks.push(chunk);
    }
    return chunks;
}

// Función para iniciar el bot
const bot = () => {
    console.log("Iniciando el bot...");
    let sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    // Guardar credenciales automáticamente
    sock.ev.on('creds.update', saveCreds);
    console.log("Credenciales guardadas");

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
        const from = message.key.remoteJid;

        console.log("Mensaje recibido", message);

        // Comprobar si el mensaje es un comando
        if (message.message?.conversation?.startsWith(prefix)) {
            const content = message.message.conversation;
            const command = content.slice(prefix.length).toLowerCase();

            // Reaccionar al mensaje para indicar que el comando ha sido detectado
            await sock.sendMessage(from, { react: { text: '💫', key: message.key } });

            // Menú 
            if (command === 'menu') {
                const pathImagen = './images/menu.jpg';
                const mensaje = '> Hola este es el menú principal \n\nNo hay nada interesante aquí por ahora XD \nEstamos en desarrollo :D \n\n\n *By Kocmoc*';
                await enviarImagenConMensaje(sock, from, pathImagen, mensaje);
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

        // Comprobar si el mensaje es una imagen con el comando /s
        if (message.message?.imageMessage && message.message?.conversation?.startsWith(prefix + 's')) {
            const buffer = await downloadContentFromMessage(message.message.imageMessage, 'image');
            const imgBuffer = Buffer.concat(await bufferToArray(buffer));

            const stickerBuffer = await sticker(imgBuffer, null, 'BotPack', 'Kocmoc');
            await sock.sendMessage(from, { sticker: stickerBuffer });
        }
    });

    return sock;
};

// Ejecutar el bot
bot();
console.log("Bot ejecutado");
