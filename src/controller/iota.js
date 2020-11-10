/**
 * Handles writing and reading data from iota
 * @module iota
 * @requires assetDB-json
 * @requires auditEntry
 * @requires key
 * @requires logger
 * @requires mamOptions
 * @requires opentracing
 * @requires transaction
 */

const AUDIT_STORAGE = '_audit';
const opentracing = require('opentracing');
const assetDBJSON = require('./assetDB-json');
const { MamOptions } = require('../model/mamOptions');
const { AuditEntry } = require('../model/auditEntry');
const key = require('./key');
const transaction = require('./transaction');

const logger = require('../logger');

const mode = process.env.MAM_MODE || 'restricted';

/**
 * List of different commit types support by the DBoM database agent
 * @const
 */
const COMMIT_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  ATTACH: 'ATTACH',
  DETACH: 'DETACH',
  TRANSFER_IN: 'TRANSFER-IN',
  TRANSFER_OUT: 'TRANSFER-OUT',
};

/**
 * Creates a forbidden channel error
 * @constructor
 */
class ForbiddenChannelError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
    this.message = 'Forbidden Channel';
    this.code = 403;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Commits a resource to iota
 * @func
 * @async
 * @param channel {string} the name of the channel
 * @param recordID {string} the id of the resource
 * @param payload {object} the payload to write
 * @param type {string} the commit type performed
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const commitResource = async (channel, recordID, payload, type, tracer, rootSpan) => {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('Iota commitResource', { childOf: rootSpan });
    span.setTag('Channel', channel);
    span.setTag('Record Id', recordID);
    span.setTag('Type', type);
  }

  if (channel === AUDIT_STORAGE) throw new ForbiddenChannelError();

  if (type === COMMIT_TYPES.CREATE || type === COMMIT_TYPES.TRANSFER_IN) {
    logger.info('Creating Asset');
    const channelConfig = assetDBJSON.getChannelConfig(channel, tracer, span);
    let mamOpts;
    let seed = null;
    if (channelConfig) {
      mamOpts = channelConfig.mamOptions;
      seed = channelConfig.seed;
      if (seed === null || typeof seed === 'undefined') {
        const error = new Error('Cannot write to read-only channel');
        error.code = 403;
        logger.error(error.message);
        if (typeof span !== 'undefined' && span !== null) {
          span.log({ event: 'error', message: error.message });
          span.setTag(opentracing.Tags.ERROR, true);
          span.finish();
        }
        throw error;
      }
    } else {
      let newKey = null;
      if (mode === 'restricted') {
        newKey = key.generateKey(81, tracer, span);
      }
      mamOpts = new MamOptions(mode, 0, newKey);
    }
    logger.debug(mamOpts);
    const assetDetails = assetDBJSON.getAssetDetails(channel, recordID, tracer, span);
    if (assetDetails) {
      const error = new Error('Asset already exists');
      error.code = 409;
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    const version = 0;
    const auditEntry = new AuditEntry(mamOpts.start, payload, recordID, type.split('-')[0], channel);
    // eslint-disable-next-line max-len
    const message = await transaction.createMAMTransaction(mamOpts, { audit: auditEntry, metadata: { version, prevRoot: null } }, seed, tracer, span);
    if (!message) {
      const error = new Error('Channel commit failed');
      error.code = 502;
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    if (!channelConfig) {
      mamOpts.start = message.state.channel.start;
      mamOpts.count = message.state.channel.count;
      assetDBJSON.addChannel(channel, mamOpts, message.state.seed, message.root, tracer, span);
    } else {
      assetDBJSON.updateChannelConfig(channel, message.state.channel, tracer, span);
    }
    assetDBJSON.addAsset(channel, recordID, message.root, message.address, version, tracer, span);
  // eslint-disable-next-line max-len
  } else if (type === COMMIT_TYPES.UPDATE || type === COMMIT_TYPES.ATTACH || type === COMMIT_TYPES.DETACH || type === COMMIT_TYPES.TRANSFER_OUT) {
    logger.info('Updating Asset');
    const channelConfig = assetDBJSON.getChannelConfig(channel, tracer, span);
    if (!channelConfig) {
      const error = new Error('Channel does not exist');
      error.code = 404;
      error.status = 'No Such Resource';
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    const mamOpts = channelConfig.mamOptions;
    const { seed } = channelConfig;
    if (seed === null || typeof tracer === 'undefined') {
      const error = new Error('Cannot write to read-only channel');
      error.code = 403;
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    const assetDetails = assetDBJSON.getAssetDetails(channel, recordID, tracer, span);
    if (!assetDetails) {
      const error = new Error('Asset does not exists');
      error.code = 404;
      error.status = 'No Such Resource';
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    const version = assetDetails.version + 1;
    const auditEntry = new AuditEntry(mamOpts.start, payload, recordID, type, channel);
    // eslint-disable-next-line max-len
    const message = await transaction.createMAMTransaction(mamOpts, { audit: auditEntry, metadata: { version, prevRoot: assetDetails.root } }, seed, tracer, span);
    if (!message) {
      const error = new Error('Channel commit failed');
      error.code = 502;
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    assetDBJSON.updateChannelConfig(channel, message.state.channel, tracer, span);
    assetDBJSON.updateAsset(channel, recordID, message.root, message.address, version, tracer, span);
  } else {
    const error = new Error(`Commit Type ${type} is not supported`);
    error.code = 409;
    logger.error(error.message);
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
  return null;
};

/**
 * Query a resource from iota
 * @func
 * @async
 * @param channel {string} the name of the channel
 * @param resourceID {string} the id of the resource
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const queryResource = async (channel, resourceID, tracer, rootSpan) => {
  logger.info('Querying Asset');
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('Iota queryResource', { childOf: rootSpan });
    span.setTag('Channel', channel);
    span.setTag('Record Id', resourceID);
  }
  if (channel === AUDIT_STORAGE) throw new ForbiddenChannelError();
  const channelConfig = assetDBJSON.getChannelConfig(channel, tracer, rootSpan);
  if (!channelConfig) {
    const error = new Error('Channel does not exist');
    error.code = 404;
    error.status = 'No Such Resource';
    logger.error(error.message);
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: error.message });
      span.setTag(opentracing.Tags.ERROR, true);
      span.finish();
    }
    throw error;
  }
  const mamOpts = channelConfig.mamOptions;
  const assetMode = mamOpts.mode;
  const sideKey = mamOpts.side_key;
  const assetDetails = assetDBJSON.getAssetDetails(channel, resourceID, tracer, rootSpan);
  if (!assetDetails) {
    const error = new Error('Asset does not exists');
    error.code = 404;
    error.status = 'No Such Resource';
    logger.error(error.message);
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: error.message });
      span.setTag(opentracing.Tags.ERROR, true);
      span.finish();
    }
    throw error;
  }
  const rootAddress = assetDetails.root;
  // eslint-disable-next-line max-len
  const resource = await transaction.getMAMTransaction(rootAddress, assetMode, sideKey, tracer, rootSpan);
  if (!resource || !resource.audit) {
    const error = new Error('Channel query failed');
    error.code = 502;
    logger.error(error.message);
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
  return resource.audit.payload;
};

/**
 * Query the audit history of a resource from iota
 * @func
 * @async
 * @param channel {string} the name of the channel
 * @param resourceID {string} the id of the resource
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const queryResourceAudit = async (channel, resourceID, tracer, rootSpan) => {
  logger.info('Querying Asset Audit');
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('Iota queryResourceAudit', { childOf: rootSpan });
    span.setTag('Channel', channel);
    span.setTag('Record Id', resourceID);
  }
  if (channel === AUDIT_STORAGE) throw new ForbiddenChannelError();
  const channelConfig = assetDBJSON.getChannelConfig(channel, tracer, span);
  if (!channelConfig) {
    const error = new Error('Channel does not exist');
    error.code = 404;
    error.status = 'No Such Resource';
    logger.error(error.message);
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: error.message });
      span.setTag(opentracing.Tags.ERROR, true);
      span.finish();
    }
    throw error;
  }
  const mamOpts = channelConfig.mamOptions;
  const assetMode = mamOpts.mode;
  const sideKey = mamOpts.side_key;
  const assetDetails = assetDBJSON.getAssetDetails(channel, resourceID, tracer, span);
  if (!assetDetails) {
    const error = new Error('Asset does not exists');
    error.code = 404;
    error.status = 'No Such Resource';
    logger.error(error.message);
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: error.message });
      span.setTag(opentracing.Tags.ERROR, true);
      span.finish();
    }
    throw error;
  }
  const rootAddress = assetDetails.root;
  const audit = [];
  // eslint-disable-next-line max-len
  let auditEntry = await transaction.getMAMTransaction(rootAddress, assetMode, sideKey, tracer, span);
  if (!auditEntry || !auditEntry.audit) {
    const error = new Error('Channel query audit failed');
    error.code = 502;
    logger.error(error.message);
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: error.message });
      span.setTag(opentracing.Tags.ERROR, true);
      span.finish();
    }
    throw error;
  }
  logger.debug(auditEntry);
  audit.push(auditEntry.audit);
  let { prevRoot } = auditEntry.metadata;
  while (prevRoot != null) {
    logger.debug(prevRoot);
    // eslint-disable-next-line max-len, no-await-in-loop
    auditEntry = await transaction.getMAMTransaction(auditEntry.metadata.prevRoot, assetMode, sideKey, tracer, span);
    if (!auditEntry || !auditEntry.audit) {
      const error = new Error('Channel query audit failed');
      error.code = 502;
      logger.error(error.message);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: error.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      throw error;
    }
    audit.push(auditEntry.audit);
    prevRoot = auditEntry.metadata.prevRoot;
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  return audit;
};

module.exports = {
  commitResource,
  queryResource,
  queryResourceAudit,
};
