"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.security = void 0;
const crypto_1 = __importDefault(require("crypto"));
function encrypt(password) {
    const encrypted = crypto_1.default.pbkdf2Sync(password, 'twdm', 1000, 64, 'sha512').toString('hex');
    return encrypted;
}
function verify(plain, cypher) {
    const supplied = encrypt(plain);
    return supplied === cypher;
}
exports.security = {
    encrypt,
    verify
};
