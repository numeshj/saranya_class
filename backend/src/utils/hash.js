import crypto from 'crypto';

const ALGO = 'scrypt';
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise((res, rej)=>{
    crypto.scrypt(password, salt, KEYLEN, { N: 16384, r:8, p:1 }, (err, buf)=>{
      if (err) return rej(err);
      res(buf.toString('hex'));
    });
  });
  return `${ALGO}:${salt}:${derived}`;
}

export async function verifyPassword(hash, password) {
  const [algo, salt, stored] = hash.split(':');
  if (algo !== ALGO) return false;
  const derived = await new Promise((res, rej)=>{
    crypto.scrypt(password, salt, KEYLEN, { N: 16384, r:8, p:1 }, (err, buf)=>{
      if (err) return rej(err);
      res(buf.toString('hex'));
    });
  });
  return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(derived, 'hex'));
}
