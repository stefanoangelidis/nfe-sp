const path = require('path');
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

//--------------------------------------------------------------------------------------------
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(helmet());


// --------------------------------------------------------------------------------------------
// RATE LIMITER

// Permite que o Express utilize o IP do cliente original em vez do IP do ALB.
app.set('trust proxy', 1);

// Middleware para logar o IP de cada requisição
// app.use((req, res, next) => {
//     console.log(`After Request IP: ${req.ip}`);
//     next();
// });

// Aqui devemos considerar:
// 1. Modo NodeJs Cluster: Algoritmo Round-Robin, distribui alternadamente entre cada filho (workers).
// 2. ALB: Algoritmo Round-Robin, distribui alternadamente entre cada filho (workers).
// Para 2 workers por instancia Fargate e 2 instâncias... temos que 4 requisições resultará em provavel 1 requisição para cada nodejs.
// 1 req a cada 2 segundos = 0.5 req/seg = 30 req/min dividido por 4 instancias = 7.5 req/minuto >>> 8 req/minuto/instância


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,    // 1 minuto
    max: 50,                     // limita cada IP a N requisições por janela de tempo (1 minuto)
    message: 'Too many requests. Try again later',
    headers: true,              // incluir cabeçalhos RateLimit no response    
});

if (process.env.NODE_ENV === 'production') {
    app.use(limiter);    
}


// --------------------------------------------------------------------------------------------

// Use morgan logging middleware only in development environment
// morgan.token('language', (req) => req.language || 'unknown');
if (process.env.NODE_ENV === 'development') {
    app.use(morgan(':method | :url | Status: :status | Size: :res[content-length] | Time: :response-time ms'));
    // app.use(morgan(':method | :url | Status: :status | Size: :res[content-length] | Time: :response-time ms | :language'));
    // app.use(morgan('dev'));
    // app.use(morgan('combined'));
}


// Use compression middleware
// app.use(compression());


// Limitar o tamanho das requisições JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));                        // 10MB permite imagens String base64 de aprox. 8MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));


app.get('/health', (req, res) => {
    res.status(200).send('OK');
});


// ROUTER FOR APP
const apiV1Router = require("./routers/apiV1Router");
app.use("/api/v1", apiV1Router);


app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


//--------------------------------------------------------------------------------------------
// Middleware de tratamento de erros

// app.use(require("./middlewares/errorMiddleware"));

//--------------------------------------------------------------------------------------------

module.exports = app;