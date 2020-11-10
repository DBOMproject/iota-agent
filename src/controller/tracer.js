/** Express router providing database agent related routes
 * @module tracer
 * @requires jaeger-client
 * @requires logger
 * @requires node-cache
 */

const initJaegerTracer = require('jaeger-client').initTracer;
const NodeCache = require('node-cache');
const logger = require('../logger');

const myCache = new NodeCache();
const jaegerConfigurationKey = 'jaegerConfiguration';

const getJaegerEnabled = function () {
  return (process.env.JAEGER_ENABLED === 'true') || false;
};

const getJaegerHost = function () {
  return process.env.JAEGER_HOST;
};

const getJaegerSamplerType = function () {
  return process.env.JAEGER_SAMPLER_TYPE || 'const';
};

const getJaegerSamplerParam = function () {
  return Number(process.env.JAEGER_SAMPLER_PARAM || 1);
};

/**
 * Gets the jaeger service name from the env variable
 * @func
 */
const getJaegerServiceName = function () {
  return process.env.JAEGER_SERVICE_NAME || 'Iota Agent';
};

const getJaegerAgentSidecarEnabled = function () {
  return (process.env.JAEGER_AGENT_SIDECAR_ENABLED === 'true') || false;
};

/**
 * Build a tracing configuration
 * @func
 * @param jaegerEnabled {boolean} is jaeger enabled
 * @param jaegerHost {string} the jaeger host to send traces to
 * @param jaegerSamplerType {string} type of sampler to use
 * @param jaegerSamplerParam {string} param required for some sampler types
 * @see [jaeger sampler documentation]{@link https://www.jaegertracing.io/docs/1.19/sampling/}
 */
// eslint-disable-next-line max-len
const buildTracingConfiguration = function (jaegerEnabled, jaegerHost, jaegerSamplerType, jaegerSamplerParam) {
  logger.debug('Build Jaeger Tracing Configuration');
  logger.debug(`Jaeger Enabled: ${jaegerEnabled}`);
  logger.debug(`Jaeger Host: ${jaegerHost}`);
  logger.debug(`Jaeger Sampler Type: ${jaegerSamplerType}`);
  logger.debug(`Jaeger Sampler Param: ${jaegerSamplerParam}`);
  if (getJaegerAgentSidecarEnabled()) {
    return {
      jaegerEnabled,
      sampler: {
        type: jaegerSamplerType,
        param: jaegerSamplerParam,
      },
    };
  }
  return {
    jaegerEnabled,
    sampler: {
      type: jaegerSamplerType,
      param: jaegerSamplerParam,
    },
    reporter: {
      agentHost: jaegerHost,
    },
  };
};

/**
 * Initializes the tracing configuration
 * @func
 */
const initTracingConfiguration = function () {
  logger.debug('Initializing Jaeger Tracing Configuration');
  const jaegerEnabled = getJaegerEnabled();
  const jaegerHost = getJaegerHost();
  const jaegerSamplerType = getJaegerSamplerType();
  const jaegerSamplerParam = getJaegerSamplerParam();
  // eslint-disable-next-line max-len
  const config = buildTracingConfiguration(jaegerEnabled, jaegerHost, jaegerSamplerType, jaegerSamplerParam);
  myCache.set(jaegerConfigurationKey, config);
  return config;
};

/**
 * Gets the tracing configuration
 * @func
 */
const getTracingConfiguration = function () {
  logger.debug('Get Jaeger Tracing Configuration');
  let config = myCache.get(jaegerConfigurationKey);
  if (!config) config = initTracingConfiguration();
  return config;
};

/**
 * Sets the tracing configuration
 * @func
 */
const setTracingConfiguration = function (newConfig) {
  logger.debug('Set Jaeger Tracing Configuration');
  const config = getTracingConfiguration();
  Object.assign(config, newConfig);
  myCache.set('jaegerConfiguration', config);
  return config;
};

/**
 * Initialize the tracer with a service name
 * @param serviceName {string} the service using the tracer
 * @func
 */
const initTracer = function (serviceName) {
  const config = getTracingConfiguration();
  // eslint-disable-next-line max-len
  if (config.jaegerEnabled !== true || (!getJaegerAgentSidecarEnabled() && !config.reporter.agentHost)) return null;
  config.serviceName = serviceName;
  config.logSpans = true;
  const options = {
    logger: {
      info: function logInfo(msg) {
        console.log('INFO ', msg);
      },
      error: function logError(msg) {
        console.log('ERROR', msg);
      },
    },
  };
  return initJaegerTracer(config, options);
};

exports.getJaegerServiceName = getJaegerServiceName;
exports.initTracer = initTracer;
exports.initTracingConfiguration = initTracingConfiguration;
exports.getTracingConfiguration = getTracingConfiguration;
exports.setTracingConfiguration = setTracingConfiguration;
exports.getJaegerAgentSidecarEnabled = getJaegerAgentSidecarEnabled;
