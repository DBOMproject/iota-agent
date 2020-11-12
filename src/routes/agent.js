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

/** Express router providing database iota related routes
 * @module route/agent
 * @requires express
 */
const express = require('express');

/**
 * Express router to mount iota agent related functions on.
 * @type {object}
 * @const
 * @namespace agentRouter
 */
const router = express.Router();
const opentracing = require('opentracing');
const logger = require('../logger');
const iota = require('../controller/iota');
const jaegerHelper = require('../controller/tracer');

jaegerHelper.initTracingConfiguration();

/**
 * Route serving the creation of a record
 * @name post/:channel/records/
 * @function
 * @async
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
// eslint-disable-next-line no-unused-vars
router.post('/:channel/records/', async (req, res, next) => {
  const { channel } = req.params;
  const { recordID } = req.body;
  const payload = req.body.recordIDPayload;
  const commitType = req.headers['commit-type'];
  let span = null;
  const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
  if (tracer != null && typeof tracer !== 'undefined') {
    const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
    if (typeof parentSpanContext !== 'undefined' && parentSpanContext != null && parentSpanContext.toTraceId() !== '') {
      span = tracer.startSpan('HTTP POST /channels/:channel/records/', {
        childOf: parentSpanContext,
      });
    } else span = tracer.startSpan('HTTP POST /channels/:channel/records/');
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.setTag('Channel', channel);
    span.setTag('Record Id', recordID);
    span.setTag('Commit Type', commitType);
  }

  logger.info(`Writing on channel ${channel}`);
  logger.info(`Writing to recordID ${recordID}`);
  logger.debug(`Payload is ${JSON.stringify(payload)}`);
  logger.info(`Commit-Type ${commitType}`);

  try {
    await iota.commitResource(channel, recordID, payload, commitType, tracer, span);
    res.json({
      success: true,
    });
  } catch (e) {
    logger.error(`Commit Error ${e.toString()}`);
    let { code, status } = e;
    if (!code) code = 500;
    if (!status) status = 'Agent Commit Failure';
    res.status(code).json({
      success: false,
      status,
      error: e.toString(),
    });
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: e.toString() });
      span.setTag(opentracing.Tags.ERROR, true);
    }
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
});

/**
 * Route serving the retrieving a record
 * @name get/:channel/records/:recordID
 * @function
 * @async
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:channel/records/:recordID', async (req, res) => {
  const { channel } = req.params;
  const { recordID } = req.params;
  let span = null;

  const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
  if (tracer !== null && typeof tracer !== 'undefined') {
    const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
    if (typeof parentSpanContext !== 'undefined' && parentSpanContext != null && parentSpanContext.toTraceId() !== '') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID', {
        childOf: parentSpanContext,
      });
    } else span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID');
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.setTag('Channel', channel);
    span.setTag('Record Id', recordID);
  }

  try {
    const record = await iota.queryResource(channel, recordID, tracer, span);
    res.json(record);
  } catch (e) {
    logger.error(`Query Error ${e.toString()}`);
    let { code, status } = e;
    if (!code) code = 500;
    if (!status) status = 'Agent Query Failure';
    res.status(code).json({
      success: false,
      status,
      error: e.toString(),
    });
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: e.toString() });
      span.setTag(opentracing.Tags.ERROR, true);
    }
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
});

/**
 * Route serving the auditing a record/audit
 * @name get/:channel/records/:recordID
 * @function
 * @async
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:channel/records/:recordID/audit', async (req, res) => {
  const { channel } = req.params;
  const { recordID } = req.params;
  let span = null;

  const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
  if (tracer !== null && typeof tracer !== 'undefined') {
    const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
    if (typeof parentSpanContext !== 'undefined' && parentSpanContext != null && parentSpanContext.toTraceId() !== '') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit', {
        childOf: parentSpanContext,
      });
    } else span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.setTag('Channel', channel);
    span.setTag('Record Id', recordID);
  }

  try {
    const record = await iota.queryResourceAudit(channel, recordID, tracer, span);
    res.json({
      history: record,
    });
  } catch (e) {
    logger.error(`Audit Error ${e.toString()}`);
    let { code, status } = e;
    if (!code) code = 500;
    if (!status) status = 'Agent Audit Failure';
    res.status(code).json({
      success: false,
      status,
      error: e.toString(),
    });
    if (typeof span !== 'undefined' && span !== null) {
      span.log({ event: 'error', message: e.toString() });
      span.setTag(opentracing.Tags.ERROR, true);
    }
  }
  if (typeof span !== 'undefined' && span !== null) {
    span.finish();
  }
});

module.exports = router;
