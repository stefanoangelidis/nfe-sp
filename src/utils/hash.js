// src/utils/hash.js

const crypto = require('crypto');

/**
 * Gera o hash SHA-1 de uma string
 * Utilizado para a senha do usuário na API da Prefeitura de São Paulo.
 * 
 * @param {string} text - Texto a ser hasheado
 * @returns {string} - Hash SHA-1 em formato hexadecimal maiúsculo
 */
function sha1(text) {
  if (typeof text !== 'string') {
    throw new TypeError('sha1: parâmetro deve ser uma string');
  }
  return crypto.createHash('sha1').update(text, 'utf8').digest('hex').toUpperCase();
}

/**
 * Gera o hash SHA-256 de uma string
 * 
 * @param {string} text - Texto a ser hasheado
 * @returns {string} - Hash SHA-256 em formato hexadecimal maiúsculo
 */
function sha256(text) {
  if (typeof text !== 'string') {
    throw new TypeError('sha256: parâmetro deve ser uma string');
  }
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

/**
 * Gera o hash MD5 de uma string
 * 
 * @param {string} text - Texto a ser hasheado
 * @returns {string} - Hash MD5 em formato hexadecimal minúsculo (padrão)
 */
function md5(text) {
  if (typeof text !== 'string') {
    throw new TypeError('md5: parâmetro deve ser uma string');
  }
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

/**
 * Gera um HMAC com SHA-256 dado uma chave e uma mensagem
 * 
 * @param {string} key - Chave secreta
 * @param {string|Buffer} message - Mensagem para autenticação
 * @returns {string} - HMAC SHA-256 em hexadecimal maiúsculo
 */
function hmacSha256(key, message) {
  if (typeof key !== 'string' && !Buffer.isBuffer(key)) {
    throw new TypeError('hmacSha256: chave deve ser string ou Buffer');
  }
  return crypto.createHmac('sha256', key).update(message).digest('hex').toUpperCase();
}

/**
 * Aplica PBKDF2 para derivar chave a partir de senha e salt
 * 
 * @param {string|Buffer} password - Senha ou chave original
 * @param {string|Buffer} salt - Salt para PBKDF2
 * @param {number} iterations - Número de iterações (ex: 10000)
 * @param {number} keylen - Tamanho da chave derivada em bytes (ex: 32)
 * @param {string} digest - Algoritmo hash (ex: 'sha256')
 * @returns {Promise<Buffer>} - Promessa que resolve a chave derivada
 */
function pbkdf2(password, salt, iterations, keylen, digest) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

/**
 * Função para hash de dados binários (Buffer) com SHA-1
 * 
 * @param {Buffer} buffer - Buffer de dados
 * @returns {string} - Hash SHA-1 hexadecimal maiúsculo
 */
function sha1Buffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('sha1Buffer: parâmetro deve ser Buffer');
  }
  return crypto.createHash('sha1').update(buffer).digest('hex').toUpperCase();
}

module.exports = {
  sha1,
  sha256,
  md5,
  hmacSha256,
  pbkdf2,
  sha1Buffer,
};
