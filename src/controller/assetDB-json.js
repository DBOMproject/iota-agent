/**
 * Handles storage of iota asset and channel state and access info
 * @module assetDB-json
 * @requires logger
 * @requires lowdb
 * @requires opentracing
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const opentracing = require('opentracing');
const logger = require('../logger');

const dbPath = process.env.DB_PATH || /* istanbul ignore next: not reusable */ 'db';

const adapter = new FileSync(`${dbPath}/assetDB.json`);
const db = low(adapter);

/**
 * Gets the channel definition from lowdb
 * @func
 * @param channelID {string} the od of the channel
 */
const getChannel = function (channelID) {
  const channel = db.read().get(`channels.${channelID}`).value();
  return channel;
};

/**
 * Gets the channels from lowdb
 * @func
 */
const getChannels = function () {
  const channel = db.read().get('channels').value();
  return channel;
};

/**
 * Adds a channel definition to lowdb
 * @func
 * @param channelID {string} the id of the channel
 * @param mamOptions {object} the mam options tied to the channel
 * @param seed {string} the seed for the channel
 * @param seed {string} the root for the channel
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 * @returns error {error} any error that occurred
 */
const addChannel = function (channelID, mamOptions, seed, root, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB addChannel', { childOf: rootSpan });
    span.setTag('Channel', channelID);
  }
  const channel = getChannel(channelID);
  if (channel) {
    const error = new Error(`Channel ${channelID} already exists`);
    logger.error(error.message);
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    return error;
  }
  db.defaults({ channels: {} })
    .write();
  if (seed) {
    db.read().set(`channels.${channelID}`, { assets: {}, config: { seed, root, mamOptions } }).write();
  } else {
    db.read().set(`channels.${channelID}`, { assets: {}, config: { root, mamOptions } }).write();
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  return null;
};

/**
 * Gets an asset definition from lowdb
 * @func
 * @param channelID {string} the id of the channel
 * @param assetId {string} the id of the asset
 */
const getAsset = function (channelID, assetID) {
  const channel = db.read().get(`channels.${channelID}.assets.${assetID}`).value();
  return channel;
};

/**
 * Adds an asset definition to lowdb
 * @func
 * @param channelID {string} the id of the channel
 * @param assetId {string} the id of the asset
 * @param rootAddress {string} the root address of the asset
 * @param address {string} the address of the asset
 * @param version {number} the current version of the asset
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 * @returns error {error} any error that occurred
 */
const addAsset = function (channelID, assetID, rootAddress, address, version, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB addAsset', { childOf: rootSpan });
    span.setTag('Channel', channelID);
    span.setTag('Record Id', assetID);
  }
  const channel = getChannel(channelID);
  if (channel) {
    const asset = getAsset(channelID, assetID);
    if (asset) {
      const err = new Error(`Asset ${assetID} already exists on channel ${channelID}`);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: err.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      return err;
    }
    db.read().set(`channels.${channelID}.assets.${assetID}`, { address, root: rootAddress, version }).write();
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    return null;
  }
  const err = new Error(`Channel ${channelID} does not exist`);
  if (typeof span !== 'undefined' && span !== null) {
    span.log({ event: 'error', message: err.message });
    span.setTag(opentracing.Tags.ERROR, true);
    span.finish();
  }
  return err;
};

/**
 * Update an asset definition to lowdb
 * @func
 * @param channelID {string} the id of the channel
 * @param assetId {string} the id of the asset
 * @param rootAddress {string} the root address of the asset
 * @param address {string} the address of the asset
 * @param version {number} the current version of the asset
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 * @returns error {error} any error that occurred
 */
const updateAsset = function (channelID, assetID, rootAddress, address, version, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB addAsset', { childOf: rootSpan });
    span.setTag('Channel', channelID);
    span.setTag('Record Id', assetID);
  }
  const channel = getChannel(channelID);
  if (channel) {
    const asset = getAsset(channelID, assetID);
    if (!asset) {
      const err = new Error(`Asset ${assetID} does not exist on channel ${channelID}`);
      if (typeof span !== 'undefined' && span !== null) {
        span.log({ event: 'error', message: err.message });
        span.setTag(opentracing.Tags.ERROR, true);
        span.finish();
      }
      return err;
    }
    db.set(`channels.${channelID}.assets.${assetID}`, { address, root: rootAddress, version }).write();
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    return null;
  }
  const err = new Error(`Channel ${channelID} does not exist`);
  if (typeof span !== 'undefined' && span !== null) {
    span.log({ event: 'error', message: err.message });
    span.setTag(opentracing.Tags.ERROR, true);
    span.finish();
  }
  return err;
};

/**
 * Gets an asset definition
 * @func
 * @param channelID {string} the id of the channel
 * @param assetId {string} the id of the asset
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const getAssetDetails = function (channelID, assetID, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB getAssetDetails', { childOf: rootSpan });
    span.setTag('Channel', channelID);
    span.setTag('Record Id', assetID);
  }
  const channel = getChannel(channelID);
  if (channel) {
    const asset = getAsset(channelID, assetID);
    if (asset) {
      logger.debug(`Return asset ${assetID} on channel ${channelID}`);
      if (typeof span !== 'undefined' && span !== null) {
        span.finish();
      }
      return asset;
    }
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    logger.debug(`Asset ${assetID} does not exist on channel ${channelID}`);
    return null;
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  logger.debug(`Channel ${channelID} does not exist`);
  return null;
};

/**
 * Gets a channel config
 * @func
 * @param channelID {string} the id of the channel
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const getChannelConfig = function (channelID, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB getChannelConfig', { childOf: rootSpan });
    span.setTag('Channel', channelID);
  }
  const channel = getChannel(channelID);
  if (channel) {
    const { config } = channel;
    logger.debug(`Returning config for channel ${channelID}`);
    logger.debug(config);
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    return config;
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  logger.debug(`Channel ${channelID} does not exist`);
  return null;
};

/**
 * Gets a channel config
 * @func
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const getChannelConfigs = function (tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB getChannelConfigs', { childOf: rootSpan });
  }
  const channels = getChannels();
  const configs = [];
  if (channels) {
    Object.keys(channels).forEach((channel) => {
      const { config } = channels[channel];
      config.sideKey = config.mamOptions.side_key;
      config.mode = config.mamOptions.mode;
      config.channelID = channel;
      config.mamOptions = null;
      configs.push(config);
    });
    logger.debug(configs);
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    return configs;
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
  logger.debug('No channels exist');
  return null;
};

/**
 * Updates a channel config
 * @func
 * @param channelID {string} the id of the channel
 * @param mamOptions {object} the mam options tied to the channel
 * @param tracer {object} the tracer to use
 * @param rootSpan {object} the root span to create a new span under
 */
const updateChannelConfig = function (channelID, mamOptions, tracer, rootSpan) {
  let span = null;
  if (tracer !== null && typeof tracer !== 'undefined' && rootSpan !== null && typeof rootSpan !== 'undefined') {
    span = tracer.startSpan('AssetDB updateChannelConfig', { childOf: rootSpan });
    span.setTag('Channel', channelID);
  }
  const channel = getChannel(channelID);
  if (channel) {
    db.read().set(`channels.${channelID}.config.mamOptions`, mamOptions).write();
    logger.debug(`Updated config for channel ${channelID}`);
    if (typeof span !== 'undefined' && span !== null) {
      span.finish();
    }
    return null;
  }
  const err = new Error(`Channel ${channelID} does not exist`);
  if (typeof span !== 'undefined' && span !== null) {
    span.log({ event: 'error', message: err.message });
    span.setTag(opentracing.Tags.ERROR, true);
    span.finish();
  }
  return err;
};

exports.addChannel = addChannel;
exports.addAsset = addAsset;
exports.updateAsset = updateAsset;
exports.getAssetDetails = getAssetDetails;
exports.getChannelConfig = getChannelConfig;
exports.getChannelConfigs = getChannelConfigs;
exports.updateChannelConfig = updateChannelConfig;
