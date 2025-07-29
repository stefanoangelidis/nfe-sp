// src/core/SoapClient.js

const soap = require('soap');
const https = require('https');
const tls = require('tls');
const forge = require('node-forge');

/**
 * SoapClient - Wrapper para cliente SOAP com suporte a certificado A1 (.pfx)
 * e otimizações para comunicação segura com webservices SOAP da Prefeitura SP.
 */
class SoapClient {
  /**
   * Cria a instância do SoapClient
   * @param {string} wsdlUrl - URL ou caminho local do arquivo WSDL
   * @param {Buffer} pfxBuffer - Buffer do certificado digital .pfx
   * @param {string} pfxPassword - Senha do certificado .pfx
   * @param {Object} [options] - Opções adicionais, timeout em ms, userAgent, etc
   */
  constructor(wsdlUrl, pfxBuffer, pfxPassword, options = {}) {
    if (!wsdlUrl) throw new Error('Parâmetro wsdlUrl obrigatório');
    if (!pfxBuffer) throw new Error('Buffer do certificado pfx é obrigatório');
    if (!pfxPassword) throw new Error('Senha do certificado pfx é obrigatória');

    this.wsdlUrl = wsdlUrl;
    this.pfxBuffer = pfxBuffer;
    this.pfxPassword = pfxPassword;

    this.options = {
      timeout: options.timeout || 15000, // 15 segundos padrão
      userAgent: options.userAgent || 'NotaFiscalSP-Client/1.0',
      maxRetries: options.maxRetries || 2,
      retryInterval: options.retryInterval || 1000, // 1 segundo
    };

    this.client = null;
    this.httpsAgent = this._createHttpsAgent();
  }

  /**
   * Cria um agente HTTPS personalizado usando o certificado A1 para autenticação TLS
   */
  _createHttpsAgent() {
    // Converte buffer pfx para PEM usando node-forge para extração
    try {
      const p12Asn1 = forge.asn1.fromDer(this.pfxBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.pfxPassword);

      // extrai chave privada
      const keyObj = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKeyPem = forge.pki.privateKeyToPem(keyObj.key);

      // extrai certificado
      const certObj = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
      const certPem = forge.pki.certificateToPem(certObj.cert);

      const agent = new https.Agent({
        cert: certPem,
        key: privateKeyPem,
        passphrase: this.pfxPassword,
        rejectUnauthorized: true,
        secureProtocol: 'TLSv1_2_method',
      });

      return agent;
    } catch (error) {
      throw new Error('Erro ao processar certificado PFX: ' + error.message);
    }
  }

  /**
   * Método privado para criar o cliente SOAP com caching.
   * Reutiliza o cliente criado para chamadas subsequentes.
   */
  async _createClient() {
    if (this.client) return this.client;

    // Cria cliente SOAP com custom HTTPS agent e opções
    const soapOptions = {
      wsdl_options: {
        agent: this.httpsAgent,
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
        },
      },
    };

    this.client = await soap.createClientAsync(this.wsdlUrl, soapOptions);
    // Forçar endpoint para garantir uso do WSDL correto
    this.client.setEndpoint(this.wsdlUrl.replace('?wsdl', ''));

    return this.client;
  }

  /**
   * Realiza a chamada SOAP para o método especificado com parâmetros
   * Faz retries caso haja falha temporária.
   * 
   * @param {string} methodName - Nome do método SOAP (ex: 'nfdEntrada')
   * @param {Object} args - Argumentos para o método SOAP
   * @returns {Promise<Object>} - Resultado da chamada SOAP
   */
  async call(methodName, args) {
    if (!methodName) throw new Error('Nome do método SOAP é obrigatório');
    if (!args) args = {};

    const maxAttempts = this.options.maxRetries + 1; // inclui primeira tentativa

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const client = await this._createClient();

        if (typeof client[methodName] !== 'function') {
          throw new Error(`Método SOAP '${methodName}' não encontrado no cliente`);
        }

        // Chamada Async do método SOAP (retorna array: [result, rawResponse, soapHeader, rawRequest])
        const [result, rawResponse, soapHeader, rawRequest] = await client[methodName + 'Async'](args);

        // Log básico - pode ser substituído por logger real
        // console.debug(`[SoapClient] Método: ${methodName}, Requisição XML: ${rawRequest}`);
        // console.debug(`[SoapClient] Método: ${methodName}, Resposta XML: ${rawResponse}`);

        return result;
      } catch (error) {
        // Se última tentativa, lança o erro
        if (attempt === maxAttempts) {
          throw new Error(`Erro na chamada SOAP '${methodName}': ${error.message}`);
        }
        // Espera antes da próxima tentativa
        await this._delay(this.options.retryInterval);
      }
    }
  }

  /**
   * Função auxiliar para espera (delay) em milissegundos
   * @param {number} ms 
   */
  _delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
}

module.exports = { SoapClient };
