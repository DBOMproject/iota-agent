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
 * Handles iota transactions
 * @module transaction
 * @requires @iota/converter
 * @requires @iota/mam
 * @requires logger
 * @requires opentracing
 * @see [iota documentation]{@link https://docs.iota.org/}
 * @see [iota client documentation]{@link https://docs.iota.org/docs/client-libraries/0.1/introduction/overview}
 * @see [mam documentation]{@link https://docs.iota.org/docs/client-libraries/0.1/mam/introduction/overview}
 */

const Mam = require('@iota/mam');
const opentracing = require('opentracing');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');
const logger = require('../logger');

// eslint-disable-next-line radix
const depth = parseInt(process.env.DEPTH) || 3;
// eslint-disable-next-line radix
const minimumWeightMagnitude = parseInt(process.env.MINIMUM_WEIGHT_MAGNITUDE) || 10;
const provider = process.env.PROVIDER || 'https://nodes.comnet.thetangle.org:443';
// eslint-disable-next-line radix
const securityLevel = parseInt(process.env.SECURITY_LEVEL) || 2;

/**
 * Creates an IOTA transaction
 * @func
 * @async
 * @param optionsMAM {object} the mam options for the asset and channel
 * @param packet {object} the packet to write to iota
 * @param seed {string} the channel seed
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const createMAMTransaction = async function (optionsMAM, packet, seed, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('Transaction createMAMTransaction', { childOf: rootSpan });
  }
  let mamState;
  if (seed) {
    mamState = Mam.init(provider, seed, securityLevel);
  } else {
    mamState = Mam.init(provider);
  }

  let { mode } = optionsMAM;
  if (!mode) {
    mode = 'public';
  }
  const sideKey = optionsMAM.side_key;
  let mamExplorerLink = '';
  if (sideKey) {
    mamExplorerLink = `https://mam-explorer.firebaseapp.com/?provider=${encodeURIComponent(provider)}&mode=${mode}&key=${sideKey.padEnd(81, '9')}&root=`;
  } else {
    mamExplorerLink = `https://mam-explorer.firebaseapp.com/?provider=${encodeURIComponent(provider)}&mode=${mode}}&root=`;
  }

  switch (mode) {
    case 'public':
      break;
    case 'restricted':
      if (!sideKey) {
        const error = new Error('Invalid MAM sidekey');
        if (typeof span !== 'undefined' && span !== null) {
          span.log({ event: 'error', message: error.message });
          span.setTag(opentracing.Tags.ERROR, true);
          span.finish();
        }
        throw error;
      }
      mamState = Mam.changeMode(mamState, mode, sideKey);
      break;
    case 'private':
      mamState = Mam.changeMode(mamState, mode);
      break;
    default: {
      const error = new Error('Invalid MAM mode');
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
  }

  if (optionsMAM.start) {
    mamState.channel.start = optionsMAM.start;
  }
  if (optionsMAM.next_count) {
    mamState.channel.next_count = optionsMAM.next_count;
  }
  if (optionsMAM.count) {
    mamState.channel.count = optionsMAM.count;
  }
  if (optionsMAM.index) {
    mamState.channel.index = optionsMAM.index;
  }

  const trytes = asciiToTrytes(JSON.stringify(packet));
  const message = Mam.create(mamState, trytes);

  try {
    // Save new mamState
    mamState = message.state;
    const { root } = message;

    let res = null;
    // Attach the payload
    if (optionsMAM.tag) {
      // eslint-disable-next-line max-len
      res = await Mam.attach(message.payload, message.address, depth, minimumWeightMagnitude, asciiToTrytes(optionsMAM.tag));
    } else {
      res = await Mam.attach(message.payload, message.address, depth, minimumWeightMagnitude);
    }
    logger.debug('Mam Attach Response');
    logger.debug(res);

    logger.debug('Published', packet, '\n');
    logger.debug(`Published${packet}`);

    logger.debug(`Verify with MAM Explorer:\n${mamExplorerLink}${root}\n`);
    logger.debug(message);
  } catch (err) {
    logger.error('Attach Error');
    const error = new Error(err.message);
    error.code = 502;
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: error.message });
      span.setTag(opentracing.Tags.ERROR, true);
      span.finish();
    }
    throw error;
  }

  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  return message;
};

/**
 * Gets an IOTA transaction
 * @func
 * @async
 * @param rootAddress {string} the root address of the transaction
 * @param mode {string} the mode the transaction is to accessed
 * @see [mode documentation]{@link https://docs.iota.org/docs/client-libraries/0.1/mam/introduction/overview#channel-types}
 * @param sidekey {string} the side key used to encrypt transaction
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const getMAMTransaction = async function (rootAddress, mode, sidekey, tracer, rootSpan) {
  // Connect to a node
  Mam.init(provider);
  logger.debug(rootAddress);
  logger.debug(mode);
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('Transaction getMAMTransaction', { childOf: rootSpan });
  }

  // Get the transaction objects in the bundle
  let response;

  await Mam.fetchSingle(rootAddress, mode, sidekey)
    .then((bundle) => {
      // Extract and parse the JSON messages from the transaction
      logger.error(bundle);
      const { payload } = bundle;
      const payloadDecoded = trytesToAscii(payload);
      response = JSON.parse(payloadDecoded);
      logger.debug(response);
    })
    .catch((err) => {
      logger.error(err);
      const error = new Error(err.message);
      error.code = 502;
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: err.message });
        span.setTag(opentracing.Tags.ERROR, true);
      }
      throw error;
    });

  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  return response;
};

exports.getMAMTransaction = getMAMTransaction;
exports.createMAMTransaction = createMAMTransaction;
