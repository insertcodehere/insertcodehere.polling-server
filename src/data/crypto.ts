import crypto from "crypto";



function encrypt(password: string): string {
  const encrypted = crypto.pbkdf2Sync(password, 'twdm', 1000, 64, 'sha512').toString('hex');

  return encrypted;
}

function verify(plain: string, cypher: string): boolean {
  const supplied = encrypt(plain);

  return supplied === cypher;
}

export const security = {
  encrypt,
  verify
};