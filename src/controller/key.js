/*
 * Copyright 2020 Unisys Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
