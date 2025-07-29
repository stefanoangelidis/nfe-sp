// src/utils/cert.js

const forge = require('node-forge');
const tls = require('tls');

/**
 * Carrega o certificado digital .pfx (PKCS#12) e senha fornecidos,
 * e extrai a chave privada e certificado em formato PEM para uso em clientes HTTPS.
 * 
 * @param {Buffer|string} pfxData - Buffer ou base64 string do arquivo .pfx
 * @param {string} password - Senha do certificado .pfx
 * @returns {Object} - Objeto com { key, cert, pfx, passphrase, secureContext }
 *   - key: chave privada em PEM
 *   - cert: certificado em PEM
 *   - pfx: Buffer original do .pfx (caso necessário para cliente)
 *   - passphrase: senha usada no pfx
 *   - secureContext: tls.SecureContext para HTTPS (node.js)
 * 
 * @throws {Error} Caso o certificado não possa ser carregado ou senha inválida
 */
function loadPfx(pfxData, password) {
  if (!pfxData) {
    throw new Error('Arquivo pfx não informado');
  }
  if (!password) {
    throw new Error('Senha do certificado é obrigatória');
  }

  // Se input for string base64, converte para Buffer
  let pfxBuffer;
  if (typeof pfxData === 'string') {
    // Remove espaços, newlines e tenta decodificar base64
    const cleaned = pfxData.replace(/(\r\n|\n|\r|\s)/gm, '');
    try {
      pfxBuffer = Buffer.from(cleaned, 'base64');
    } catch (err) {
      throw new Error('Falha ao converter string base64 do certificado: ' + err.message);
    }
  } else if (Buffer.isBuffer(pfxData)) {
    pfxBuffer = pfxData;
  } else {
    throw new TypeError('pfxData deve ser Buffer ou string base64');
  }

  try {
    // Decodifica buffer para formato ASN.1 do forge
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    // Extrai chave privada (PKCS #8)
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBag || keyBag.length === 0) {
      throw new Error('Chave privada não encontrada no arquivo PFX');
    }
    const privateKey = keyBag[0].key;
    const keyPem = forge.pki.privateKeyToPem(privateKey);

    // Extrai certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || certBag.length === 0) {
      throw new Error('Certificado não encontrado no arquivo PFX');
    }
    const certificate = certBag[0].cert;
    const certPem = forge.pki.certificateToPem(certificate);

    // Cria contexto TLS seguro para HTTPS com chave e certificado PEM
    const secureContext = tls.createSecureContext({
      key: keyPem,
      cert: certPem,
      passphrase: password,
      rejectUnauthorized: true,  // rejeita certificados inválidos
      minVersion: 'TLSv1.2'
    });

    return {
      key: keyPem,
      cert: certPem,
      pfx: pfxBuffer,
      passphrase: password,
      secureContext
    };
  } catch (error) {
    throw new Error(`Falha ao carregar certificado PFX: ${error.message}`);
  }
}

module.exports = {
  loadPfx,
};
