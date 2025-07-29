// src/core/NotaFiscalSP.js

const fs = require('fs');
const path = require('path');
const { SoapClient } = require('./SoapClient');
const { WsdlFactory } = require('./WsdlFactory');
const { buildRpsXml } = require('../xml/RpsBuilder');
const { buildCancelXml } = require('../xml/CancelBuilder');
const { sha1 } = require('../utils/hash');

/**
 * Configurações e objetos necessários para comunicação com o webservice da Prefeitura de SP para NFS-e (Nota do Milhão).
 */
class NotaFiscalSP {
  /**
   * @param {Object} options
   * @param {string} options.cnpj - CNPJ do tomador/prestador (sem formatação)
   * @param {string|Buffer} options.certificado - Caminho para o arquivo .pfx ou Buffer do certificado
   * @param {string} options.senhaCertificado - Senha do certificado (pfx)
   * @param {'producao'|'homologacao'} [options.ambiente='producao'] - Ambiente do serviço
   * @param {string} [options.usuario=''] - CPF do usuário autorizado (geralmente CPF do responsável)
   * @param {string} [options.senhaUsuario=''] - Senha configurada na Prefeitura para o usuário (aplicada hash SHA1)
   */
  constructor({
    cnpj,
    certificado,
    senhaCertificado,
    ambiente = 'producao',
    usuario = '',
    senhaUsuario = '',
  }) {
    if (!cnpj) throw new Error('CNPJ obrigatório na inicialização');
    if (!certificado) throw new Error('Certificado digital (.pfx) é obrigatório');
    if (!senhaCertificado) throw new Error('Senha do certificado é obrigatória');

    this.cnpj = cnpj.replace(/\D/g, '');
    this.ambiente = ambiente === 'homologacao' ? 'hml' : 'prod';
    this.usuario = usuario.replace(/\D/g, '') || ''; // CPF com números apenas
    this.senhaUsuario = senhaUsuario ? sha1(senhaUsuario) : ''; // hash SHA1 obrigatório

    this.im = null; // Inscrição municipal (carregada dinamicamente)

    // Lê o certificado: se for caminho, lê o arquivo, se for buffer, usa direto
    this.certificadoBuffer =
      typeof certificado === 'string'
        ? fs.readFileSync(path.resolve(certificado))
        : certificado;

    this.senhaCertificado = senhaCertificado;

    // Obter URLs WSDL conforme ambiente
    const wsdlUrls = WsdlFactory.build(this.ambiente);

    // Instancia clientes SOAP para cada serviço
    this.soapEntrada = new SoapClient(wsdlUrls.entrada, this.certificadoBuffer, this.senhaCertificado);
    this.soapSaida = new SoapClient(wsdlUrls.saida, this.certificadoBuffer, this.senhaCertificado);
    this.soapUtil = new SoapClient(wsdlUrls.util, this.certificadoBuffer, this.senhaCertificado);
  }

  /**
   * Consulta inscrição municipal para o CNPJ configurado.
   * Retorna objeto com informações cadastradas, incluindo Inscrição Municipal (IM).
   */
  async consultarInscricao(cnpjConsulta) {
    const cpf = this.usuario;
    const senha = this.senhaUsuario;
    const cnpjAlvo = (cnpjConsulta || this.cnpj).replace(/\D/g, '');

    const params = {
      cnpj: cnpjAlvo,
      cpfUsuario: cpf,
      senha,
    };

    const response = await this.soapUtil.call('consultarCnpj', params);

    if (!response || !response.inscricaomunicipal) {
      throw new Error('Não foi possível obter inscrição municipal para o CNPJ informado.');
    }
    this.im = response.inscricaomunicipal;
    return response;
  }

  /**
   * Emite uma NFS-e (Nota Fiscal de Serviço Eletrônica) enviando o RPS XML construído.
   * O payload deve conter os dados da nota, que serão convertidos em XML.
   * 
   * @param {Object} rpsPayload - dados do RPS / NFS-e a enviar
   * @param {string} rpsPayload.cpfUsuario - CPF do usuário autorizador
   * @param {string} rpsPayload.numeroRps - Número do RPS
   * // demais campos conforme contrato do RPS na Prefeitura, deverá ser convertido em XML
   * @returns {Promise<Object>} - resposta com protocolo de recebimento
   */
  async enviarNota(rpsPayload) {
    if (!this.im) {
      await this.consultarInscricao();
    }
    if (!rpsPayload) throw new Error('Payload para envio da nota é obrigatório');

    // Constrói XML do RPS conforme dados enviados
    const xml = buildRpsXml({ ...rpsPayload, im: this.im });

    const params = {
      cpfUsuario: this.usuario,
      senha: this.senhaUsuario,
      codCidade: 1, // Código fixo para São Paulo
      xml,
    };

    const response = await this.soapEntrada.call('nfdEntrada', params);

    // Retorna o recibo de protocolo da nota emitida
    return response;
  }

  /**
   * Consulta a situação de uma nota emitida, via número do recibo (protocolo).
   * @param {string} reciboNumero - Número do protocolo/recibo retornado no envio da nota
   * @returns {Promise<Object>} - Resultado da consulta da nota
   */
  async consultarNota(reciboNumero) {
    if (!this.im) {
      await this.consultarInscricao();
    }
    if (!reciboNumero) throw new Error('Número do recibo é obrigatório para consulta');

    const params = {
      cpfUsuario: this.usuario,
      senha: this.senhaUsuario,
      im: this.im,
      xmlRecibo: reciboNumero,
    };

    const response = await this.soapSaida.call('nfdSaida', params);
    return response;
  }

  /**
   * Cancela uma nota emitida.
   * @param {Object} cancelPayload - Objeto com dados necessários para o cancelamento.
   * @param {string} cancelPayload.cpfUsuario - CPF do usuário autorizador
   * @param {string} cancelPayload.numeroRps - Número da nota para cancelar
   * @param {string} cancelPayload.motivo - Justificativa para cancelamento
   * @returns {Promise<Object>} - Resposta da operação de cancelamento
   */
  async cancelarNota(cancelPayload) {
    if (!cancelPayload) throw new Error('Payload para cancelamento é obrigatório');
    if (!cancelPayload.numeroRps) throw new Error('Número do RPS/nfs a cancelar é obrigatório');
    if (!cancelPayload.motivo) throw new Error('Motivo do cancelamento é obrigatório');
    if (!this.usuario) throw new Error('CPF usuário deve estar configurado para cancelamento');

    // Constrói XML para cancelamento
    const xml = buildCancelXml(cancelPayload);

    const params = {
      cpfUsuario: this.usuario,
      senha: this.senhaUsuario,
      xml,
    };

    const response = await this.soapEntrada.call('nfdEntradaCancelar', params);

    return response;
  }

  /**
   * Consulta status de lote de notas.
   * @param {number|string} numeroLote - Número do lote gerenciado pela Prefeitura
   * @returns {Promise<Object>} - Resultado da consulta do lote
   */
  async consultarLote(numeroLote) {
    if (!this.im) {
      await this.consultarInscricao();
    }
    if (!numeroLote) throw new Error('Número do lote é obrigatório para consulta');

    const params = {
      cpfUsuario: this.usuario,
      senha: this.senhaUsuario,
      im: this.im,
      numeroLote,
    };

    const response = await this.soapSaida.call('nfdConsultaLote', params);

    return response;
  }
}

module.exports = { NotaFiscalSP };