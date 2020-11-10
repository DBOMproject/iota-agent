/** Handles creation of loggers
 * @module logger
 * @requires winston
 */

const winston = require('winston');

/**
 * Creates a logger
 * @func
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),

  ),
  msg: 'HTTP {{req.method}} {{req.url}}',
  ignoredRoutes: ['/'],
});

/* istanbul ignore next */
logger.stream = {
  write: (info) => {
    logger.info(info);
  },
};

module.exports = logger;
