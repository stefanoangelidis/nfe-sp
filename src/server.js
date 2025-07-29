require('dotenv').config();

const http = require('http');
let app;
let server;

const PORT = process.env.PORT || 8080;

async function startServer() {
  
  try {
    
    app = require('./app');
    server = http.createServer(app);
    
    server.listen(PORT, () => {
      console.log(`Worker ${process.pid} listening on port ${PORT}...`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
      // console.log(`DB_NAME: ${process.env.DB_NAME}`);
      // console.log(`DB_NAME_RDS: ${process.env.DB_NAME_RDS}`);
    });

  } catch(err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

}

//-----------------------------------------------------------------
// Capturar eventos de interrupção para fechar a conexão MongoDB
process.on('SIGINT', async () => {
  // console.log('SIGINT received. Closing MongoDB connection.');
  // await closeMongoConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // console.log('SIGTERM received. Closing MongoDB connection.');
  // await closeMongoConnection();
  process.exit(0);
});
//-----------------------------------------------------------------

startServer();