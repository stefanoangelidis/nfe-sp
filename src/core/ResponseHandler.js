// src/core/ResponseHandler.js
// Responsável por processar, normalizar, e extrair informações das respostas SOAP recebidas dos webservices da Prefeitura de São Paulo para NFS-e.

const { XMLParser } = require('fast-xml-parser');

/**
 * ResponseHandler - Classe utilitária para tratamento e normalização
 * de respostas SOAP/XML dos webservices da Prefeitura SP.
 */
class ResponseHandler {
  /**
   * Inicializa o parser XML com configurações adequadas.
   */
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
      trimValues: true,
      removeNSPrefix: true,
      // Outras configurações podem ser ajustadas conforme necessidade
    });
  }

  /**
   * Parseia string XML para objeto JavaScript.
   * @param {string} xml - XML a ser parseado
   * @returns {Object} - Objeto JS representando o XML
   */
  parseXml(xml) {
    if (!xml || typeof xml !== 'string') {
      throw new Error('parseXml: XML inválido ou vazio');
    }
    return this.parser.parse(xml);
  }

  /**
   * Verifica se a resposta SOAP contém erro/falha (fault).
   * @param {Object|string} response - Objeto já parseado ou XML puro
   * @returns {boolean} - true se houver fault
   */
  hasFault(response) {
    if (typeof response === 'string') {
      response = this.parseXml(response);
    }
    return response && response.Envelope && response.Envelope.Body && response.Envelope.Body.Fault;
  }

  /**
   * Extrai mensagem de erro/fault da resposta SOAP parseada.
   * @param {Object} response - Objeto parseado da resposta XML
   * @returns {string|null} - Mensagem de erro ou null se não houver
   */
  getFaultMessage(response) {
    if (!response || !response.Envelope || !response.Envelope.Body || !response.Envelope.Body.Fault) {
      return null;
    }
    const fault = response.Envelope.Body.Fault;
    if (typeof fault === 'string') {
      return fault;
    }
    // Tenta extrair motivo da falha, código e detalhes
    const faultString = fault.faultstring || fault.faultString || '';
    const faultCode = fault.faultcode || fault.faultCode || '';
    const detail = fault.detail || '';
    let message = faultString;
    if (faultCode) {
      message = `[${faultCode}] ${message}`;
    }
    if (detail) {
      message += ` - Detalhe: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    }
    return message.trim();
  }

  /**
   * Normaliza a resposta da prefeitura extraindo dados úteis e status.
   * Pode ser customizado para cada método SOAP usado.
   * @param {Object} responseObj - Objeto parseado da resposta
   * @param {string} rootNode - Nome esperado do núcleo da resposta comum (ex: 'nfdEntradaReturn')
   * @returns {Object} - Objeto com propriedades: success(boolean), data(qualquer), error(string|null)
   */
  normalizeResponse(responseObj, rootNode) {
    if (!responseObj) {
      return { success: false, data: null, error: 'Resposta vazia' };
    }

    // Busca o body
    const body = responseObj.Envelope && responseObj.Envelope.Body;
    if (!body) {
      return { success: false, data: null, error: 'Resposta sem corpo (Body)' };
    }

    // Verifica falha SOAP
    if (body.Fault) {
      return {
        success: false,
        data: null,
        error: this.getFaultMessage(responseObj),
      };
    }

    // Busca o nó de resultado esperado (ex: nfdEntradaReturn)
    const result = rootNode ? body[rootNode] : null;

    if (!result) {
      // Se não achou nó, retorna o corpo para análise
      return {
        success: true,
        data: body,
        error: null,
      };
    }

    // Análise comum dos dados contidos
    // Exemplo: objeto com status, código, mensagem, protocolo
    // Pode customizar conforme estrutura retornada pelo webservice

    let success = false;
    let error = null;

    // Exemplo heurística para campos comuns:
    if (typeof result === 'object') {
      // Normalmente o campo 'status' ou 'situacao' indica sucesso ('1' ou 'Processado')
      const statusVal = result.status || result.situacao || result.Status || '';
      success = (statusVal === '1' || /processado/i.test(statusVal));

      // Mensagem de erro ou motivo se houver
      if (!success) {
        error = result.mensagem || result.MsgErro || result.erro || null;
        if (!error) {
          // tenta compor erro genérico
          error = JSON.stringify(result);
        }
      }
    } else {
      // Resposta simples assume sucesso
      success = true;
    }

    return {
      success,
      data: result,
      error,
    };
  }
}

module.exports = { ResponseHandler };
