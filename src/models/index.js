// src/models/index.js
// Funciona como um ponto central de exportação, reunindo os principais modelos usados na biblioteca (por exemplo, a classe Rps)
// para facilitar a importação em outras partes do projeto.


const Rps = require('./Rps');

// Aqui você pode adicionar outros modelos no futuro, como Tomador, Cancelamento, etc.
// Exemplo:
// const Tomador = require('./Tomador');
// const Cancelamento = require('./Cancelamento');

module.exports = {
  Rps,
  // Tomador,
  // Cancelamento,
};
