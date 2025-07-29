// src/xml/Parser.js

const { XMLParser, XMLBuilder } = require('fast-xml-parser');

/**
 * Parser - utilitário para converter XML <-> JavaScript Objects,
 * com tratamento para namespaces e normalização específica do padrão SP NFS-e.
 */
class Parser {
  constructor() {
    // Configurações do parser conforme necessidades da Prefeitura SP
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
      trimValues: true,
      removeNSPrefix: true,
      allowBooleanAttributes: true,
      parseTagValue: false,
      // Pode adaptar transformações e tipos conforme necessidade
    });

    // Configuração do builder para conversão JS -> XML
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,       // formata com indentação
      indentBy: '  ',
      suppressEmptyNode: true,
    });
  }

  /**
   * Converte uma string XML para objeto JavaScript
   * @param {string} xmlString - XML para ser parseado
   * @returns {Object} - Objeto JavaScript resultante
   */
  parse(xmlString) {
    if (typeof xmlString !== 'string') {
      throw new TypeError('parse: parâmetro deve ser uma string XML');
    }
    try {
      const parsed = this.parser.parse(xmlString);
      return parsed;
    } catch (error) {
      throw new Error('Falha ao parsear XML: ' + error.message);
    }
  }

  /**
   * Converte objeto JavaScript para string XML
   * @param {Object} jsObject - Objeto JavaScript a ser convertido para XML
   * @returns {string} - String XML gerada
   */
  build(jsObject) {
    if (typeof jsObject !== 'object' || jsObject === null) {
      throw new TypeError('build: parâmetro deve ser um objeto JS não nulo');
    }

    try {
      const xml = this.builder.build(jsObject);
      return xml;
    } catch (error) {
      throw new Error('Falha ao construir XML: ' + error.message);
    }
  }
}

module.exports = {
  Parser,
};
