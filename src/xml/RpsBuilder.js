// src/xml/RpsBuilder.js

const { create } = require('xmlbuilder2');

/**
 * Função que constrói o XML para o envio do RPS (NFS-e) conforme o layout da Prefeitura de São Paulo.
 * 
 * @param {Object} data - Dados do RPS e NFS-e
 * @param {string} data.im - Inscrição municipal do prestador
 * @param {Object} data.rps - Dados do RPS
 * @param {string} data.rps.numeroRps - Número do RPS
 * @param {string} data.rps.serie - Série do RPS (normalmente "RPS")
 * @param {string} data.rps.dataEmissao - Data de emissão do RPS (formato ISO - ex: "2025-01-30T10:00:00")
 * @param {string} data.rps.tipo - Tipo do RPS (1 para RPS normal, 2 para RPS subsídio)
 * @param {Object} data.servico - Dados do serviço prestado
 * @param {number} data.servico.valorServicos - Valor total do serviço
 * @param {string} data.servico.codigoServico - Código do serviço (Código CNAE, por exemplo)
 * @param {number} data.servico.issRetido - Indicador se o ISS é retido na fonte (1 ou 2)
 * @param {number} [data.servico.aliquotaServicos] - Alíquota de ISS (ex: 0.05 para 5%)
 * @param {string} data.servico.discriminacao - Discriminação/descrição do serviço
 * @param {Object} data.tomador - Dados do tomador do serviço
 * @param {string} [data.tomador.cpf] - CPF do tomador (se pessoa física)
 * @param {string} [data.tomador.cnpj] - CNPJ do tomador (se pessoa jurídica)
 * @param {string} data.tomador.razaoSocial - Nome ou razão social do tomador
 * @param {Object} data.tomador.endereco - Endereço do tomador
 * @param {string} data.tomador.endereco.logradouro
 * @param {string} data.tomador.endereco.numero
 * @param {string} [data.tomador.endereco.complemento]
 * @param {string} data.tomador.endereco.bairro
 * @param {string} data.tomador.endereco.codigoMunicipio - Código do município (ex: 3550308 para SP)
 * @param {string} data.tomador.endereco.uf - Sigla do estado (ex: "SP")
 * @param {string} data.tomador.endereco.cep - CEP (somente números)
 * @param {string} [data.emailTomador] - Email do tomador (opcional)
 * 
 * @returns {string} - XML do RPS pronto para envio
 */
function buildRpsXml(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Dados do RPS são obrigatórios para construção do XML');
  }
  if (!data.im) {
    throw new Error('Inscrição Municipal "im" é obrigatória');
  }
  if (!data.rps) {
    throw new Error('Objeto "rps" é obrigatório');
  }
  if (!data.servico) {
    throw new Error('Objeto "servico" é obrigatório');
  }
  if (!data.tomador) {
    throw new Error('Objeto "tomador" é obrigatório');
  }

  // Preenchimento de valores obrigatórios dentro de rps e servico
  const {
    im,
    rps,
    servico,
    tomador,
    emailTomador = ''
  } = data;

  // Constrói XML base do RPS
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('nfd')
    .ele('prestador')
      .ele('inscricao').txt(im).up()
    .up()
    .ele('listaNfse');

  // Cria o nó rps dentro da lista
  const rpsNode = root.ele('nfs')
    .ele('rps');

  // Dados do RPS
  rpsNode.ele('numero').txt(rps.numeroRps.toString()).up();
  rpsNode.ele('serie').txt(rps.serie).up();
  rpsNode.ele('dataEmissao').txt(rps.dataEmissao).up();
  rpsNode.ele('tipo').txt(rps.tipo || '1').up(); // 1 = RPS Normal

  // Dados do serviço
  const servicoNode = rpsNode.ele('servico');
  servicoNode.ele('valorServicos').txt(servico.valorServicos.toFixed(2)).up();
  servicoNode.ele('codigoServico').txt(servico.codigoServico).up();
  servicoNode.ele('issRetido').txt(servico.issRetido ? servico.issRetido.toString() : '2').up();

  if (typeof servico.aliquotaServicos === 'number') {
    servicoNode.ele('aliquotaServicos').txt(servico.aliquotaServicos.toFixed(4)).up();
  }

  servicoNode.ele('discriminacao').txt(servico.discriminacao).up();
  servicoNode.up(); // fecha <servico>

  // Dados do tomador
  const tomadorNode = rpsNode.ele('tomador');
  
  if (tomador.cpf) {
    tomadorNode.ele('cpf').txt(tomador.cpf.replace(/\D/g, '')).up();
  } else if (tomador.cnpj) {
    tomadorNode.ele('cnpj').txt(tomador.cnpj.replace(/\D/g, '')).up();
  }

  tomadorNode.ele('razaoSocial').txt(tomador.razaoSocial).up();

  // Endereço do tomador
  const enderecoNode = tomadorNode.ele('endereco');
  enderecoNode.ele('logradouro').txt(tomador.endereco.logradouro).up();
  enderecoNode.ele('numero').txt(tomador.endereco.numero).up();

  if (tomador.endereco.complemento) {
    enderecoNode.ele('complemento').txt(tomador.endereco.complemento).up();
  }

  enderecoNode.ele('bairro').txt(tomador.endereco.bairro).up();
  enderecoNode.ele('codigoMunicipio').txt(tomador.endereco.codigoMunicipio).up();
  enderecoNode.ele('uf').txt(tomador.endereco.uf).up();
  enderecoNode.ele('cep').txt(tomador.endereco.cep.replace(/\D/g, '')).up();
  enderecoNode.up(); // fecha <endereco>

  // Email do tomador, opcional
  if (emailTomador) {
    tomadorNode.ele('email').txt(emailTomador).up();
  }

  tomadorNode.up(); // fecha <tomador>

  rpsNode.up(); // fecha <rps>
  root.up(); // fecha <nfs>
  root.up(); // fecha <listaNfse>
  root.up(); // fecha <nfd>

  // Retorna o XML como string com formatação
  return root.end({ prettyPrint: true });
}

module.exports = { buildRpsXml };
