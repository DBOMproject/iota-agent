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

const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);
const Mam = require('@iota/mam');
const sinon = require('sinon');
const { asciiToTrytes } = require('@iota/converter');
const { before, describe, it } = require('mocha');

const jaegerHelper = require('../controller/tracer');
const key = require('../controller/key');
const { MamOptions } = require('../model/mamOptions');

process.env.MONGOURI = 'mongodb://127.0.0.1:27071';

before((done) => {
  process.env.JAEGER_ENABLED = 'true';
  process.env.JAEGER_HOST = 'localhost:4124';
  process.env.MAM_MODE = 'restricted';
  // eslint-disable-next-line global-require
  done();
});

describe('getMAMTransaction with Jaeger', () => {
  let transactionStub;
  // eslint-disable-next-line global-require
  const transaction = require('../controller/transaction');
  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('getMAMTransaction Existing', async () => {
    const res = {};
    res.payload = asciiToTrytes('{"audit":{"payload":{"test":"test"}}}');
    res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await transaction.getMAMTransaction('', '', '', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    expect(response.audit.payload.test).to.equals('test');
  });
  it('getMAMTransaction Error', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'fetchSingle').rejects(err);
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    try {
      await transaction.getMAMTransaction('', '', '', tracer, span);
      expect(true).to.equals(false);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledOnce).to.be.true;
      expect(error.message).to.equals('error');
    }
  });
});

describe('getMAMTransaction no Jaeger', () => {
  let transactionStub;
  // eslint-disable-next-line global-require
  const transaction = require('../controller/transaction');
  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('getMAMTransaction Existing', async () => {
    const res = {};
    res.payload = asciiToTrytes('{"audit":{"payload":{"test":"test"}}}');
    res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    const response = await transaction.getMAMTransaction('', '', '', null, null);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    expect(response.audit.payload.test).to.equals('test');
  });
  it('getMAMTransaction Error', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'fetchSingle').rejects(err);
    try {
      await transaction.getMAMTransaction('', '', '', null, null);
      expect(true).to.equals(false);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledOnce).to.be.true;
      expect(error.message).to.equals('error');
    }
  });
});

describe('createMAMTransaction no Jaeger', () => {
  let transactionStub;
  // eslint-disable-next-line global-require
  const transaction = require('../controller/transaction');
  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('createMAMTransaction none', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    await transaction.createMAMTransaction({}, { audit: { payload: { test: 'test' } } }, null, null, null);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });

  it('createMAMTransaction public', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    await transaction.createMAMTransaction({ mode: 'public' }, { audit: { payload: { test: 'test' } } }, null, null, null);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });

  it('createMAMTransaction public seed', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    await transaction.createMAMTransaction({ mode: 'public' }, { audit: { payload: { test: 'test' } } }, 'OGMMQJUDMNNYSOAXMJWAMNAJPHWMGVAY9UWBXRGTXXVEDIEWSNYRNDQY99NDJQB9QQBPCRRNFAIUPGPLZ', null, null);

    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });

  it('createMAMTransaction tag', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    await transaction.createMAMTransaction({ mode: 'public', tag: 'tag' }, { audit: { payload: { test: 'test' } } }, null, null, null);

    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });

  it('createMAMTransaction private', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    await transaction.createMAMTransaction({ mode: 'private' }, { audit: { payload: { test: 'test' } } }, null, null, null);

    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });

  it('createMAMTransaction restricted', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    const opts = new MamOptions('restricted', 1, key.generateKey(81, null, null));
    opts.count = 1;
    opts.index = 1;
    await transaction.createMAMTransaction(opts, { audit: { payload: { test: 'test' } } }, null, null, null);

    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });
  it('createMAMTransaction Error', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(err);
    try {
      await transaction.createMAMTransaction({ mode: 'public' }, { audit: { payload: { test: 'test' } } }, null, null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledOnce).to.be.true;
      expect(error.message).to.equals('error');
    }
  });
  it('createMAMTransaction bad mode', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(err);
    try {
      await transaction.createMAMTransaction({ mode: 'bad' }, { audit: { payload: { test: 'test' } } }, null, null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(error.message).to.equals('Invalid MAM mode');
    }
  });
  it('createMAMTransaction No Side Key', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(err);
    try {
      await transaction.createMAMTransaction({ mode: 'restricted' }, { audit: { payload: { test: 'test' } } }, null, null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(error.message).to.equals('Invalid MAM sidekey');
    }
  });
});

describe('createMAMTransaction with Jaeger', () => {
  let transactionStub;
  // eslint-disable-next-line global-require
  const transaction = require('../controller/transaction');

  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('createMAMTransaction restricted', async () => {
    const res = { succeed: 'true' };
    // res.payload = { succeed: 'true' };
    // res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'attach').resolves(res);
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const opts = new MamOptions('restricted', 1, key.generateKey(81, tracer, span));
    opts.count = 1;
    opts.index = 1;
    await transaction.createMAMTransaction(opts, { audit: { payload: { test: 'test' } } }, null, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // expect(response.audit.payload.test).to.equals('test');
  });
  it('createMAMTransaction Error', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(err);
    try {
      const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
      let span;
      if (tracer !== null && typeof tracer !== 'undefined') {
        span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
      }
      await transaction.createMAMTransaction({ mode: 'public' }, { audit: { payload: { test: 'test' } } }, null, tracer, span);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledOnce).to.be.true;
      expect(error.message).to.equals('error');
    }
  });
  it('createMAMTransaction bad mode', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(err);
    try {
      const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
      let span;
      if (tracer !== null && typeof tracer !== 'undefined') {
        span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
      }
      await transaction.createMAMTransaction({ mode: 'bad' }, { audit: { payload: { test: 'test' } } }, null, tracer, span);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(error.message).to.equals('Invalid MAM mode');
    }
  });
  it('createMAMTransaction No Side Key', async () => {
    const err = new Error('error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(err);
    try {
      const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
      let span;
      if (tracer !== null && typeof tracer !== 'undefined') {
        span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
      }
      await transaction.createMAMTransaction({ mode: 'restricted' }, { audit: { payload: { test: 'test' } } }, null, tracer, span);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(error.message).to.equals('Invalid MAM sidekey');
    }
  });
});
