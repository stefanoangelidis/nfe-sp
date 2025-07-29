// src/core/WsdlFactory.js

/**
 * WsdlFactory - Gera URLs dos serviços WSDL para emissão da NFS-e
 * no município de São Paulo, com suporte a ambientes de produção e homologação.
 */
class WsdlFactory {
    /**
     * Retorna um objeto com as URLs dos WSDLs dos serviços principais,
     * variando conforme o ambiente especificado.
     * 
     * @param {'prod'|'hml'} ambiente - Ambiente: 'prod' para produção, 'hml' para homologação
     * @returns {{ entrada: string, saida: string, util: string }}
     */
    static build(ambiente) {
      // Normaliza ambiente para valores aceitos
      const env = (ambiente || 'prod').toLowerCase();
  
      // Base URLs oficiais do sistema da Prefeitura de São Paulo
      const baseUrls = {
        prod: 'https://nfe.prefeitura.sp.gov.br/ws',
        hml: 'https://homologacao.nfe.prefeitura.sp.gov.br/ws'
      };
  
      const base = baseUrls[env] || baseUrls.prod;
  
      return {
        entrada: `${base}/WSEntrada.e?wsdl`,
        saida: `${base}/WSSaida.e?wsdl`,
        util: `${base}/WSUtil.e?wsdl`
      };
    }
  }
  
  module.exports = { WsdlFactory };
  