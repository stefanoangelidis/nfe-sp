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
        logger2.log(fileName, functionName, 'error', errorMessage, { errorCode: errorCode, user: user });     // REGISTRAMOS O ERRO NO CLOUDWATCH
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


module.exports = {    
    teste,
}