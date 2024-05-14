# Saeta
file:///home/kocmoc/Saeta/index.js:37
    const content = message.message.conversation;
                                    ^

TypeError: Cannot read properties of null (reading 'conversation')
    at EventEmitter.<anonymous> (file:///home/kocmoc/Saeta/index.js:37:37)
    at EventEmitter.emit (node:events:517:28)
    at EventEmitter.<anonymous> (/home/kocmoc/Saeta/node_modules/baileys/lib/Utils/event-buffer.js:40:16)
    at EventEmitter.emit (node:events:517:28)
    at Object.flush (/home/kocmoc/Saeta/node_modules/baileys/lib/Utils/event-buffer.js:73:16)
    at processNodeWithBuffer (/home/kocmoc/Saeta/node_modules/baileys/lib/Socket/messages-recv.js:689:12)

Node.js v18.19.1
