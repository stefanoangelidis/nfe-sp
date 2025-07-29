const express = require('express');
const router = express.Router();

// const authMiddleware = require('../middlewares/authMiddleware');
// const commonParamsMiddleware = require('../middlewares/commonParamsMiddleware');
const apiV1Controller = require('../controllers/apiV1Controller');



//==============================================================================
// ROTAS NÃO PROTEGIDAS
//==============================================================================
// router.post('/addLog', commonParamsMiddleware, apiV1Controller.addLog);


//==============================================================================
// ROTAS PROTEGIDAS
// TODO: Implementar authMiddleware
//==============================================================================
router.post('/teste', apiV1Controller.teste);



module.exports = router;