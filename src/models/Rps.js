// src/models/Rps.js

/**
 * Classe Rps - representa um Recibo Provisório de Serviço (RPS)
 * para uso na emissão da NFS-e no município de São Paulo.
 * Permite construir o RPS de forma fluente, garantindo validações básicas.
 */
class Rps {
    constructor() {
      // Dados básicos do RPS
      this.numeroRps = null;       // Número do RPS (string ou number)
      this.serie = 'RPS';          // Série do RPS, default "RPS"
      this.dataEmissao = null;     // Data emissão no formato ISO string
      this.tipo = 1;               // Tipo do RPS: 1=RPS normal, 2=subsídiado
      
      // Dados do serviço
      this.valorServicos = null;   // Valor total do serviço (number)
      this.codigoServico = null;   // Código do serviço (string)
      this.aliquotaServicos = null;// Alíquota de ISS (decimal, ex: 0.05)
      this.issRetido = 2;          // ISS retido na fonte (2=Não retido, 1=Retido)
      this.discriminacao = null;   // Discriminação ou descrição do serviço (string)
  
      // Dados do tomador do serviço
      this.tomadorCpf = null;        // CPF (string) do tomador (se pessoa física)
      this.tomadorCnpj = null;       // CNPJ (string) do tomador (se pessoa jurídica)
      this.tomadorRazaoSocial = null;// Nome/Razão Social do tomador
      this.tomadorEndereco = null;   // Endereço do tomador (objeto)
      this.tomadorEmail = null;      // Email do tomador
      
      // Campos opcionais adicionais (pode estender depois)
      // ...
    }
  
    /**
     * Define o número do RPS.
     * @param {string|number} numero 
     * @returns {Rps}
     */
    setNumeroRps(numero) {
      if (!numero) throw new Error('Número do RPS é obrigatório');
      this.numeroRps = numero.toString();
      return this;
    }
  
    /**
     * Define a série do RPS.
     * @param {string} serie 
     * @returns {Rps}
     */
    setSerie(serie) {
      if (!serie) throw new Error('Série é obrigatória');
      this.serie = serie.toString();
      return this;
    }
  
    /**
     * Define a data de emissão do RPS.
     * Aceita objeto Date ou string ISO.
     * @param {Date|string} data 
     * @returns {Rps}
     */
    setDataEmissao(data) {
      if (!data) throw new Error('Data de emissão é obrigatória');
      
      if (data instanceof Date) {
        this.dataEmissao = data.toISOString();
      } else if (typeof data === 'string') {
        // Valida string ISO básica
        if (isNaN(Date.parse(data))) {
          throw new Error('Data de emissão inválida');
        }
        this.dataEmissao = data;
      } else {
        throw new Error('Data de emissão deve ser Date ou string ISO');
      }
      return this;
    }
  
    /**
     * Define o tipo do RPS - 1 (normal) ou 2 (subsidiado).
     * @param {number} tipo 
     * @returns {Rps}
     */
    setTipo(tipo) {
      if (![1, 2].includes(tipo)) {
        throw new Error('Tipo deve ser 1 (normal) ou 2 (subsidiado)');
      }
      this.tipo = tipo;
      return this;
    }
  
    /**
     * Define o valor total dos serviços.
     * @param {number} valor 
     * @returns {Rps}
     */
    setValorServicos(valor) {
      if (typeof valor !== 'number' || valor < 0) {
        throw new Error('Valor dos serviços deve ser número positivo');
      }
      this.valorServicos = valor;
      return this;
    }
  
    /**
     * Define o código do serviço.
     * Deve seguir o código válido conforme tabela da prefeitura.
     * @param {string} codigo 
     * @returns {Rps}
     */
    setCodigoServico(codigo) {
      if (!codigo) throw new Error('Código do serviço é obrigatório');
      this.codigoServico = codigo.toString();
      return this;
    }
  
    /**
     * Define a alíquota de ISS, por exemplo 0.05 para 5%.
     * @param {number} aliquota 
     * @returns {Rps}
     */
    setAliquotaServicos(aliquota) {
      if (typeof aliquota !== 'number' || aliquota < 0 || aliquota > 1) {
        throw new Error('Alíquota deve ser número entre 0 e 1');
      }
      this.aliquotaServicos = aliquota;
      return this;
    }
  
    /**
     * Define se o ISS é retido na fonte.
     * @param {number} issRetido 1 = Retido, 2 = Não retido
     * @returns {Rps}
     */
    setIssRetido(issRetido) {
      if (![1, 2].includes(issRetido)) {
        throw new Error('ISS retido deve ser 1 (retido) ou 2 (não retido)');
      }
      this.issRetido = issRetido;
      return this;
    }
  
    /**
     * Define a descrição/discriminação do serviço.
     * @param {string} texto 
     * @returns {Rps}
     */
    setDiscriminacao(texto) {
      if (!texto) throw new Error('Descrição (discriminação) do serviço é obrigatória');
      this.discriminacao = texto.toString();
      return this;
    }
  
    /**
     * Configura dados do tomador PJ (Pessoa Jurídica).
     * @param {Object} dados
     * @param {string} dados.cnpj - CNPJ do tomador
     * @param {string} dados.razaoSocial - Razão social do tomador
     * @param {Object} dados.endereco - Endereço do tomador
     * @param {string} [dados.email] - Email opcional
     * @returns {Rps}
     */
    setTomadorPJ({ cnpj, razaoSocial, endereco, email }) {
      if (!cnpj) throw new Error('CNPJ do tomador é obrigatório');
      if (!razaoSocial) throw new Error('Razão social do tomador é obrigatória');
      if (!endereco) throw new Error('Endereço do tomador é obrigatório');
  
      this.tomadorCnpj = cnpj.replace(/\D/g, '');
      this.tomadorRazaoSocial = razaoSocial;
      this.tomadorCpf = null; // reseta CPF
      this.tomadorEndereco = endereco;
      if (email) {
        this.tomadorEmail = email;
      }
      return this;
    }
  
    /**
     * Configura dados do tomador PF (Pessoa Física).
     * @param {Object} dados
     * @param {string} dados.cpf - CPF do tomador
     * @param {string} dados.nome - Nome completo do tomador
     * @param {Object} dados.endereco - Endereço do tomador
     * @param {string} [dados.email] - Email opcional
     * @returns {Rps}
     */
    setTomadorPF({ cpf, nome, endereco, email }) {
      if (!cpf) throw new Error('CPF do tomador é obrigatório');
      if (!nome) throw new Error('Nome do tomador é obrigatório');
      if (!endereco) throw new Error('Endereço do tomador é obrigatório');
  
      this.tomadorCpf = cpf.replace(/\D/g, '');
      this.tomadorRazaoSocial = nome;
      this.tomadorCnpj = null; // reseta CNPJ
      this.tomadorEndereco = endereco;
      if (email) {
        this.tomadorEmail = email;
      }
      return this;
    }
  
    /**
     * Retorna o objeto simples para construção do XML.
     * Deve estar compatível com o builder XML usado.
     * @returns {Object}
     */
    toObject() {
      if (
        this.numeroRps === null ||
        this.dataEmissao === null ||
        this.valorServicos === null ||
        this.codigoServico === null ||
        !this.discriminacao ||
        !this.tomadorRazaoSocial ||
        !this.tomadorEndereco
      ) {
        throw new Error('Campos obrigatórios do RPS não preenchidos');
      }
  
      const obj = {
        rps: {
          numeroRps: this.numeroRps,
          serie: this.serie,
          dataEmissao: this.dataEmissao,
          tipo: this.tipo,
        },
        servico: {
          valorServicos: this.valorServicos,
          codigoServico: this.codigoServico,
          aliquotaServicos: this.aliquotaServicos,
          issRetido: this.issRetido,
          discriminacao: this.discriminacao,
        },
        tomador: {
          razaoSocial: this.tomadorRazaoSocial,
          endereco: this.tomadorEndereco,
        },
      };
  
      if (this.tomadorCpf) {
        obj.tomador.cpf = this.tomadorCpf;
      } else if (this.tomadorCnpj) {
        obj.tomador.cnpj = this.tomadorCnpj;
      }
  
      if (this.tomadorEmail) {
        obj.emailTomador = this.tomadorEmail;
      }
  
      return obj;
    }
  }
  
  module.exports = Rps;
  