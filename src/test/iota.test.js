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
const sinon = require('sinon');
const decache = require('decache');
const { before, describe, it } = require('mocha');

let transaction;
let iota;
let assetDBJSON;

before((done) => {
  decache('../controller/assetDB-json');
  decache('../controller/iota');
  decache('../controller/transaction');
  process.env.JAEGER_ENABLED = 'false';
  process.env.MAM_MODE = 'public';
  // eslint-disable-next-line global-require
  // eslint-disable-next-line global-require
  transaction = require('../controller/transaction');
  // eslint-disable-next-line global-require
  iota = require('../controller/iota');
  // eslint-disable-next-line global-require
  assetDBJSON = require('../controller/assetDB-json');
  done();
});

describe('commitResource no Jaeger', () => {
  let transactionStub;
  let assetDBChannelStub;
  let assetDBAssetStub;
  let assetDBAddChannelStub;
  let assetDBAddAssetStub;

  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    assetDBChannelStub.restore();
    assetDBAssetStub.restore();
    assetDBAddChannelStub.restore();
    assetDBAddAssetStub.restore();
    done();
  });

  it('commitResource New Channel', async () => {
    const resTransaction = { state: { channel: { channel: 'testChannel', seed: 'TEST', start: 'TEST', count: 1 } } };
    const resDBChannel = null;
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'addChannel').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'addAsset').returns(true);
    const response = await iota.commitResource('testChannel', 'testResource', {}, 'CREATE', null, null);
    console.log('response');
    console.log(response);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAssetStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAddChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAddAssetStub.calledOnce).to.be.true;
    expect(response).to.equals(null);
  });

  it('commitResource Existing Channel', async () => {
    const resTransaction = { state: { channel: { channel: 'testChannel', seed: 'TEST', start: 'TEST', count: 1 } } };
    const resDBChannel = { mamOptions: { mode: 'public', start: 'TEST' }, seed: 'TEST' };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'updateChannelConfig').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'addAsset').returns(true);
    const response = await iota.commitResource('testChannel', 'testResource', {}, 'CREATE', null, null);
    console.log('response');
    console.log(response);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAssetStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAddChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAddAssetStub.calledOnce).to.be.true;
    expect(response).to.equals(null);
  });

  it('commitResource ReadOnly Channel', async () => {
    const resTransaction = { state: { channel: { channel: 'testChannel', seed: 'TEST', start: 'TEST', count: 1 } } };
    const resDBChannel = { mamOptions: { mode: 'public', start: 'TEST' }, seed: null };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'updateChannelConfig').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'addAsset').returns(true);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'CREATE', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Cannot write to read-only channel');
    }
  });

  it('commitResource Error', async () => {
    const resTransaction = null;
    const resDBChannel = null;
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'addChannel').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'addAsset').returns(true);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'CREATE', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel commit failed');
    }
  });

  it('commitResource Attach', async () => {
    const resTransaction = { state: { channel: { channel: 'testChannel', seed: 'TEST', start: 'TEST', count: 1 } } };
    const resDBChannel = { mamOptions: { mode: 'public', start: 'TEST' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST', version: 1 };
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'updateChannelConfig').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'updateAsset').returns(true);
    const response = await iota.commitResource('testChannel', 'testResource', {}, 'ATTACH', null, null);
    console.log('response');
    console.log(response);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAssetStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAddChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAddAssetStub.calledOnce).to.be.true;
    expect(response).to.equals(null);
  });

  it('commitResource Attach ReadOnly Channel', async () => {
    const resTransaction = { state: { channel: { channel: 'testChannel', seed: 'TEST', start: 'TEST', count: 1 } } };
    const resDBChannel = { mamOptions: { mode: 'public', start: 'TEST' }, seed: null };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'updateChannelConfig').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'addAsset').returns(true);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'ATTACH', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Cannot write to read-only channel');
    }
  });

  it('commitResource Detach Failure', async () => {
    const resTransaction = null;
    const resDBChannel = { mamOptions: { mode: 'public', start: 'TEST' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST', version: 1 };
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    assetDBAddChannelStub = sinon.stub(assetDBJSON, 'updateChannelConfig').returns(true);
    assetDBAddAssetStub = sinon.stub(assetDBJSON, 'addAsset').returns(true);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'DETACH', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel commit failed');
    }
  });

  it('commitResource Forbidden Channel', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = null;
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.commitResource('_audit', 'testResource', {}, 'CREATE', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      expect(error.message).to.equals('Forbidden Channel');
    }
  });

  it('commitResource Create Existing Asset', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'CREATE', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Asset already exists');
    }
  });

  it('commitResource Update Missing Channel', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = null;
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'UPDATE', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel does not exist');
    }
  });

  it('commitResource Update Missing Asset', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'UPDATE', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBAssetStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Asset does not exists');
    }
  });

  it('commitResource Bad Type', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.commitResource('testChannel', 'testResource', {}, 'BAD', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      expect(error.message).to.equals('Commit Type BAD is not supported');
    }
  });
});

describe('queryResource no Jaeger', () => {
  let transactionStub;
  let assetDBChannelStub;
  let assetDBAssetStub;

  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    assetDBChannelStub.restore();
    assetDBAssetStub.restore();
    done();
  });

  it('queryResource Existing', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    const response = await iota.queryResource('testChannel', 'testResource', null, null);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAssetStub.calledOnce).to.be.true;
    expect(response.test).to.equals('test');
  });

  it('queryResource Forbidden Channel', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = null;
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResource('_audit', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      expect(error.message).to.equals('Forbidden Channel');
    }
  });

  it('queryResource Missing Channel', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = null;
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResource('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel does not exist');
    }
  });

  it('queryResource Missing Asset', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResource('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBAssetStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Asset does not exists');
    }
  });

  it('queryResource Query Failed', async () => {
    const resTransaction = null;
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResource('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBAssetStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel query failed');
    }
  });
});

describe('queryResourceAudit no Jaeger', () => {
  let transactionStub;
  let assetDBChannelStub;
  let assetDBAssetStub;

  // eslint-disable-next-line no-undef
  afterEach((done) => {
    transactionStub.restore();
    assetDBChannelStub.restore();
    assetDBAssetStub.restore();
    done();
  });

  it('queryResourceAudit Existing', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } }, metadata: { prevRoot: null } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    const response = await iota.queryResourceAudit('testChannel', 'testResource', null, null);
    console.log('response');
    console.log(response);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAssetStub.calledOnce).to.be.true;
    expect(response.length).to.equals(1);
    expect(response[0].payload.test).to.equals('test');
  });

  it('queryResourceAudit Existing Multiple', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } }, metadata: { prevRoot: 'TEST' } };
    const resTransaction2 = { audit: { payload: { test: 'test2' } }, metadata: { prevRoot: null } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').onCall(0).resolves(resTransaction).onCall(1).resolves(resTransaction2);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    const response = await iota.queryResourceAudit('testChannel', 'testResource', null, null);
    console.log('response');
    console.log(response);
    // eslint-disable-next-line no-unused-expressions
    expect(transactionStub.calledTwice).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBChannelStub.calledOnce).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(assetDBAssetStub.calledOnce).to.be.true;
    expect(response.length).to.equals(2);
    expect(response[0].payload.test).to.equals('test');
    expect(response[1].payload.test).to.equals('test2');
  });

  it('queryResourceAudit Existing Multiple Query Error', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } }, metadata: { prevRoot: 'TEST' } };
    const resTransaction2 = null;
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').onCall(0).resolves(resTransaction).onCall(1).resolves(resTransaction2);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResourceAudit('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledTwice).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBAssetStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel query audit failed');
    }
  });

  it('queryResourceAudit Forbidden Channel', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = null;
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResourceAudit('_audit', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      expect(error.message).to.equals('Forbidden Channel');
    }
  });

  it('queryResourceAudit Missing Channel', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = null;
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResourceAudit('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel does not exist');
    }
  });

  it('queryResourceAudit Missing Asset', async () => {
    const resTransaction = { audit: { payload: { test: 'test' } } };
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = null;
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResourceAudit('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBAssetStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Asset does not exists');
    }
  });

  it('queryResourceAudit Query Failed', async () => {
    const resTransaction = null;
    const resDBChannel = { mamOptions: { mode: 'public' }, seed: 'TEST' };
    const resDBAsset = { root: 'TEST' };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(resTransaction);
    assetDBChannelStub = sinon.stub(assetDBJSON, 'getChannelConfig').returns(resDBChannel);
    assetDBAssetStub = sinon.stub(assetDBJSON, 'getAssetDetails').returns(resDBAsset);
    try {
      await iota.queryResourceAudit('testChannel', 'testResource', null, null);
      expect(false).to.equals(true);
    } catch (error) {
      // eslint-disable-next-line no-unused-expressions
      expect(transactionStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBChannelStub.calledOnce).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(assetDBAssetStub.calledOnce).to.be.true;
      expect(error.message).to.equals('Channel query audit failed');
    }
  });
});
