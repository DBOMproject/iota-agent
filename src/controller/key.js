/**
 * Handles key generation
 * @module key
 * @requires logger
 */

const logger = require('../logger');

/**
 * Generates a random iota key
 * @func
 * @param length {number} the length of key to generate
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
function generateKey(length, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('Key generateKey', { childOf: rootSpan });
  }
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  logger.debug('Generated key');
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  return result;
}

exports.generateKey = generateKey;
