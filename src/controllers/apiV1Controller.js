// controllers/apiV1Controller.js
const { NotaFiscalSP } = require('../core/NotaFiscalSP');
const logger = require('../utils/logger');
const path = require('path');


//==============================================================================
// FUNÇÕES AUXILIARES
//==============================================================================

//-------------------------------------------------------------
function sendSuccessResponse(res, data) {
    // console.log('sendSuccessResponse() | data: ' + data);
    res.json({ result: data });
}


//-------------------------------------------------------------
function sendErrorResponse(res, functionName, errorMessage, errorCode, log = true, user = '') {
    
    errorCode = errorCode || 100;
    errorMessage = errorMessage || "Undefined Error";
    
    if (errorMessage.startsWith("Access denied for")) {
        errorMessage = "Access denied for user";
    }

    if(log == true) {
        // logger2.log(fileName, functionName, 'error', errorMessage, { errorCode: errorCode, user: user });     // REGISTRAMOS O ERRO NO CLOUDWATCH
    }    
    res.json({ error: true, errorCode, errorMessage });
}


//------------------------------------------------------------------------------
// TESTE
//------------------------------------------------------------------------------
async function teste(req, res, next) {

    try {

        console.log("========================================");
        console.log("teste:");
        console.log("Query:", req.query);
        console.log("Body:", req.body);       
                
        return sendSuccessResponse(res, req.body);
        
    } catch(err) {
        return sendErrorResponse(res, 'teste', err.message, err.errorCode, true, req.email);
    }
}


//------------------------------------------------------------------------------
// EMISSÃO DE NOTA FISCAL
//------------------------------------------------------------------------------
async function emitirNota(req, res, next) {
    try {
        console.log("========================================");
        console.log("emitirNota:");
        console.log("Query:", req.query);
        console.log("Body:", req.body);       
                
        return sendSuccessResponse(res, req.body);
    } catch(err) {
        return sendErrorResponse(res, 'emitirNota', err.message, err.errorCode, true, req.email);
    }
}

//------------------------------------------------------------------------------
// CONSULTAR NOTA FISCAL
//------------------------------------------------------------------------------
async function consultarNota(req, res, next) {
    
    try {
        
        logger.info('========================================');
        logger.info('consultarNota');
        logger.info('Query:', req.query);
        logger.info('Body:', req.body);
        
        // ------------------------------------------------------------------
        // 1. Validação
        // ------------------------------------------------------------------
        const recibo = (req.query.recibo || req.body.recibo || '').toString().trim();
        if (!recibo) {
        return sendErrorResponse(
            res,
            'consultarNota',
            'Parâmetro "recibo" é obrigatório.',
            'PARAM_MISSING'
        );
        }

        // ------------------------------------------------------------------
        // 2. Instancia o SDK NotaFiscalSP
        // ------------------------------------------------------------------
        const nfsp = new NotaFiscalSP({
            cnpj: process.env.EMPRESA_CNPJ,
            // certificado: Buffer.from(process.env.PFX_BASE64, 'base64'), // ou caminho para arquivo .pfx
            certificado: path.resolve(__dirname, '../../certificados/up-leg-certificate-2025.pfx'),
            senhaCertificado: process.env.CERT_PASSWORD,
            ambiente: process.env.AMBIENTE || 'producao',
            usuario: process.env.NFSE_CPF_USUARIO,
            senhaUsuario: process.env.NFSE_SENHA_USUARIO       // será SHA-1 internamente
        });

        // ------------------------------------------------------------------
        // 3. Consulta a nota
        // ------------------------------------------------------------------
        const resultado = await nfsp.consultarNota(recibo);

        // ------------------------------------------------------------------
        // 4. Retorno de sucesso
        // ------------------------------------------------------------------
        return sendSuccessResponse(res, {
            success: true,
            recibo,
            data: resultado
        });

    } catch(err) {
        logger.error('consultarNota :: erro=%o', err);
        return sendErrorResponse(res, 'consultarNota', err.message || 'Erro desconhecido', err.errorCode || 'NFSE_CONSULTA_FALHA', true);
    }
}

//------------------------------------------------------------------------------
// CANCELAR NOTA FISCAL
//------------------------------------------------------------------------------
async function cancelarNota(req, res, next) {
    try {
        console.log("========================================");
        console.log("cancelarNota:");
        console.log("Query:", req.query);
        console.log("Body:", req.body);       
                
        return sendSuccessResponse(res, req.body);
    } catch(err) {
        return sendErrorResponse(res, 'cancelarNota', err.message, err.errorCode, true, req.email);
    }
}

//------------------------------------------------------------------------------
// CONSULTAR INSCRIÇÃO MUNICIPAL
//------------------------------------------------------------------------------
async function consultarInscricao(req, res, next) {
    try {
        console.log("========================================");
        console.log("consultarInscricao:");
        console.log("Query:", req.query);
        console.log("Body:", req.body);       
                
        return sendSuccessResponse(res, req.body);
    } catch(err) {
        return sendErrorResponse(res, 'consultarInscricao', err.message, err.errorCode, true, req.email);
    }
}


module.exports = {    
    teste,
    emitirNota,
    consultarNota,
    cancelarNota,
    consultarInscricao,
}