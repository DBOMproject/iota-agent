/**
 * @module iota-agent
 * @requires cookie-parser
 * @requires express
 * @requires express-winston
 * @requires route/index
 * @requires route/agent
 * @requires winston
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const winston = require('winston');

const expressWinston = require('express-winston');
const indexRouter = require('./routes/index');
const agentRouter = require('./routes/agent');

/**
 * Express app providing pgp related functions.
 * @type {object}
 * @const
 */
const app = express();

app.use(expressWinston.logger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => `${info.timestamp} ${info.level} ${info.message}`),

  ),
  msg: 'HTTP {{req.method}} {{req.url}}',
  ignoredRoutes: ['/'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/channels', agentRouter);

module.exports = app;
