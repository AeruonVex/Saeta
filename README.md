> base_module@1.0.0 start
> node index.js

file:///home/kocmoc/Saeta/index.js:2
import { makeWASocket, DisconnectReason, useMultiFileAuthState, MessageType } from 'baileys';
                                                                ^^^^^^^^^^^
SyntaxError: Named export 'MessageType' not found. The requested module 'baileys' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'baileys';
const { makeWASocket, DisconnectReason, useMultiFileAuthState, MessageType } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:123:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:191:5)
    at async ModuleLoader.import (node:internal/modules/esm/loader:336:24)
    at async loadESM (node:internal/process/esm_loader:34:7)
    at async handleMainPromise (node:internal/modules/run_main:106:12)

Node.js v18.19.1
