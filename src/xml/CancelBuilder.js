// src/xml/CancelBuilder.js

const { create } = require('xmlbuilder2');

/**
 * Função que constrói o XML para cancelamento da NFS-e (Nota do Milhão)
 * conforme especificação da Prefeitura de São Paulo.
 * 
 * @param {Object} data - Dados para construção do cancelamento
 * @param {string} data.im - Inscrição municipal do prestador
 * @param {string} data.numeroNfse - Número da nota fiscal eletrônica a ser cancelada
 * @param {string} data.serie - Série da nota (ex: "RPS" ou outro)
 * @param {string} data.motivo - Justificativa para o cancelamento (máx. 255 caracteres)
 * @param {string} [data.dataEmissao] - Data de emissão da NF-e (opcional ISO 8601)
 *  
 * @returns {string} - XML de cancelamento formatado para envio
 */
function buildCancelXml(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Dados para cancelamento são obrigatórios');
  }
  const { im, numeroNfse, serie, motivo, dataEmissao } = data;

  if (!im) throw new Error('Inscrição municipal (im) é obrigatória');
  if (!numeroNfse) throw new Error('Número da NF-e para cancelamento é obrigatório');
  if (!serie) throw new Error('Série da NF-e para cancelamento é obrigatória');
  if (!motivo) throw new Error('Motivo do cancelamento é obrigatório');
  if (motivo.length > 255) {
    throw new Error('Motivo do cancelamento não pode exceder 255 caracteres');
  }

  // Construção do XML para cancelamento
  // A estrutura base segue o layout exigido pelo webservice 'nfdEntradaCancelar'
  const xmlDoc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('nfd')
      .ele('prestador')
        .ele('inscricao').txt(im).up()
      .up()
      .ele('cancelar')
        .ele('nfs')
          .ele('numero').txt(numeroNfse.toString()).up()
          .ele('serie').txt(serie).up();
  
  // Data de emissão é opcional, incluir se fornecida
  if (dataEmissao) {
    xmlDoc.ele('dataEmissao').txt(dataEmissao).up();
  }

  xmlDoc.up() // fecha <nfs>
    .ele('motivo').txt(motivo).up()
  .up() // fecha <cancelar>
  .up(); // fecha <nfd>

  return xmlDoc.end({ prettyPrint: true });
}

module.exports = { buildCancelXml };
