// src/utils/logger.js

const util = require('util');

/**
 * Logger simples para biblioteca NotaFiscalSP
 * Suporta níveis: error, warn, info, debug
 * Permite ativar/desativar logs via variável de ambiente
 */

class Logger {
  /**
   * @param {string} level - Nível mínimo de log: 'error', 'warn', 'info', 'debug'
   * (logs abaixo desse nível serão ignorados)
   */
  constructor(level = 'info') {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    this.currentLevel = this.levels[level] !== undefined ? this.levels[level] : this.levels.info;
  }

  /**
   * Verifica se o nível informado está ativo
   * @param {string} level 
   */
  isLevelEnabled(level) {
    return this.levels[level] <= this.currentLevel;
  }

  /**
   * Formata a mensagem com timestamp e nível
   * @param {string} level 
   * @param {any[]} args 
   */
  formatMessage(level, args) {
    const timestamp = new Date().toISOString();
    const msg = args.map(arg => (typeof arg === 'string' ? arg : util.inspect(arg, { depth: 3 }))).join(' ');
    return `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
  }

  error(...args) {
    if (!this.isLevelEnabled('error')) return;
    console.error(this.formatMessage('error', args));
  }

  warn(...args) {
    if (!this.isLevelEnabled('warn')) return;
    console.warn(this.formatMessage('warn', args));
  }

  info(...args) {
    if (!this.isLevelEnabled('info')) return;
    console.info(this.formatMessage('info', args));
  }

  debug(...args) {
    if (!this.isLevelEnabled('debug')) return;
    console.debug(this.formatMessage('debug', args));
  }
}

// Instância padrão, configura nível pela variável de ambiente LOG_LEVEL
const defaultLevel = process.env.LOG_LEVEL || 'info';
const logger = new Logger(defaultLevel);

module.exports = logger;
