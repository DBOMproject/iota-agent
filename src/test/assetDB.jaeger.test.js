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
const { before, after, describe, it } = require('mocha');
const fs = require('fs');
const path = require('path');
const os = require('os');
const decache = require('decache');
const jaegerHelper = require('../controller/tracer');

let assetDB;

let tmpDir;

before((done) => {
  const tmpPath = path.join(os.tmpdir(), 'assetdb-test');
  // eslint-disable-next-line global-require
  fs.mkdtemp(tmpPath, (err, folder) => {
    if (err) throw err;
    process.env.DB_PATH = folder;
    tmpDir = folder;
    decache('../controller/assetDB-json');
    // eslint-disable-next-line global-require
    assetDB = require('../controller/assetDB-json');
    done();
  });
});

after((done) => {
  // eslint-disable-next-line global-require
  fs.unlinkSync(path.join(tmpDir, 'assetDB.json'));
  fs.rmdirSync(tmpDir, { recursive: true });
  done();
});

describe('getChannelConfigs no channels', () => {
  it('getChannelConfigs no channels', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getChannelConfigs(tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
});

describe('addChannel with Jaeger', () => {
  it('addChannel', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.addChannel('testChannel', { start: 2 }, 'TEST', 'TEST', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
  it('addChannel no seed', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.addChannel('testChannel2', {}, '', 'TEST', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
  it('addChannel Existing', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.addChannel('testChannel', {}, 'TEST', 'TEST', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('error');
    expect(response.message).to.equals('Channel testChannel already exists');
  });
});

describe('addAsset with Jaeger', () => {
  it('addAsset', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.addAsset('testChannel', 'testAsset', 'TEST', 'TEST', 0, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
  it('addAsset no channel', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.addAsset('missingChannel', 'testAsset', 'TEST', 'TEST', 0, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('error');
    expect(response.message).to.equals('Channel missingChannel does not exist');
  });
  it('addAsset Existing', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.addAsset('testChannel', 'testAsset', 'TEST', 'TEST', 0, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('error');
    expect(response.message).to.equals('Asset testAsset already exists on channel testChannel');
  });
});

describe('updateAsset with Jaeger', () => {
  it('updateAsset', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.updateAsset('testChannel', 'testAsset', 'TEST', 'TEST', 1, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
  it('updateAsset no channel', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.updateAsset('missingChannel', 'testAsset', 'TEST', 'TEST', 0, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('error');
    expect(response.message).to.equals('Channel missingChannel does not exist');
  });
  it('updateAsset Not Existing', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.updateAsset('testChannel', 'missingAsset', 'TEST', 'TEST', 0, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('error');
    expect(response.message).to.equals('Asset missingAsset does not exist on channel testChannel');
  });
});

describe('getAssetDetails', () => {
  it('getAssetDetails', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getAssetDetails('testChannel', 'testAsset', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('object');
    expect(response.address).to.equals('TEST');
    expect(response.root).to.equals('TEST');
    expect(response.version).to.equals(1);
  });
  it('getAssetDetails no channel', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getAssetDetails('missingChannel', 'testAsset', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
  it('getAssetDetails missing', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getAssetDetails('testChannel', 'missingAsset', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
});

describe('getChannelConfig', () => {
  it('getChannelConfig', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getChannelConfig('testChannel', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('object');
    expect(response.seed).to.equals('TEST');
    expect(response.mamOptions.start).to.equals(2);
  });
  it('getChannelConfig missing channel', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getChannelConfig('missingChannel', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
});

describe('getChannelConfigs', () => {
  it('getChannelConfigs', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getChannelConfigs(tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response.length).to.equals(2);
    expect(response[0].channelID).to.equals('testChannel');
    expect(response[0].root).to.equals('TEST');
    expect(response[0].seed).to.equals('TEST');
  });
});

describe('updateChannelConfig with Jaeger', () => {
  it('updateChannelConfig', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.updateChannelConfig('testChannel', { start: 3 }, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.equals(null);
  });
  it('updateChannelConfig check update', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.getChannelConfig('testChannel', tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('object');
    expect(response.seed).to.equals('TEST');
    expect(response.mamOptions.start).to.equals(3);
  });
  it('updateChannelConfig no channel', async () => {
    const tracer = jaegerHelper.initTracer(jaegerHelper.getJaegerServiceName());
    let span;
    if (tracer !== null && typeof tracer !== 'undefined') {
      span = tracer.startSpan('HTTP GET /channels/:channel/records/:recordID/audit');
    }
    const response = await assetDB.updateChannelConfig('missingChannel', {}, tracer, span);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.a('error');
    expect(response.message).to.equals('Channel missingChannel does not exist');
  });
});
