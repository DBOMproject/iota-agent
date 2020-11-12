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
const fs = require('fs');
const path = require('path');
const os = require('os');
const { asciiToTrytes } = require('@iota/converter');
const {
  before, after, afterEach, describe, it,
} = require('mocha');

let app;
let tmpDir;
let Mam;

let transaction;

before((done) => {
  const tmpPath = path.join(os.tmpdir(), 'api-test');
  // eslint-disable-next-line global-require
  fs.mkdtemp(tmpPath, (err, folder) => {
    if (err) throw err;
    process.env.DB_PATH = folder;
    tmpDir = folder;
    decache('../controller/assetDB-json');
    decache('../app');
    decache('@iota/mam');
    decache('../controller/transaction');
    // eslint-disable-next-line global-require
    Mam = require('@iota/mam');
    // eslint-disable-next-line global-require
    transaction = require('../controller/transaction');
    process.env.JAEGER_ENABLED = 'false';
    // eslint-disable-next-line global-require
    app = require('../app');
    done();
  });
});

after((done) => {
  // eslint-disable-next-line global-require
  fs.unlinkSync(path.join(tmpDir, 'assetDB.json'));
  fs.rmdirSync(tmpDir, { recursive: true });
  done();
});

describe('Index no Jaeger', () => {
  it('Index', (done) => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equals('Chainsource IOTA Agent');
        done();
      });
  });
});

describe('Bad Params no Jaeger', () => {
  it('Bad Type', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'BAD')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(409);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        done();
      });
  });
});

describe('Create no Jaeger', () => {
  let transactionStub;
  // res.payload = { succeed: 'true' };
  // res.nextRoot = 'test';

  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('Create New', (done) => {
    const result = { succeed: 'true' };
    transactionStub = sinon.stub(Mam, 'attach').resolves(result);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.equals(true);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Create New Existing Channel', (done) => {
    const result = { succeed: 'true' };
    transactionStub = sinon.stub(Mam, 'attach').resolves(result);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'test2',
        recordIDPayload: {
          test: 'test2',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.equals(true);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Create Fail Commit', (done) => {
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(null);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'error',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Create MAM Error', (done) => {
    const result = new Error('Error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(result);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'error',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Create Error Existing', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(409);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        done();
      });
  });
});

describe('Update no Jaeger', () => {
  let transactionStub;
  // res.payload = { succeed: 'true' };
  // res.nextRoot = 'test';

  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('Update New', (done) => {
    const result = { succeed: 'true' };
    transactionStub = sinon.stub(Mam, 'attach').resolves(result);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'UPDATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test2',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.equals(true);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Update Fail Commit', (done) => {
    transactionStub = sinon.stub(transaction, 'createMAMTransaction').resolves(null);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'UPDATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Update MAM Error', (done) => {
    const result = new Error('Error');
    transactionStub = sinon.stub(Mam, 'attach').rejects(result);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'UPDATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Update Missing Channel', (done) => {
    chai
      .request(app)
      .post('/channels/missing/records')
      .set('commit-type', 'UPDATE')
      .send({
        recordID: 'test2',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        done();
      });
  });
  it('Update Missing Asset', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'DETACH')
      .send({
        recordID: 'missing',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        done();
      });
  });
  it('Update Forbidden Channel', (done) => {
    chai
      .request(app)
      .post('/channels/_audit/records')
      .set('commit-type', 'ATTACH')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        done();
      });
  });
});

describe('Get no Jaeger', () => {
  let transactionStub;
  // res.payload = { succeed: 'true' };
  // res.nextRoot = 'test';

  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('Get Record', (done) => {
    const res = {};
    res.payload = asciiToTrytes('{"audit":{"payload":{"test":"test"}}}');
    res.nextRoot = 'test';
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/test/records/test')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.test).to.equals('test');
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Get Fail Query', (done) => {
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(null);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .get('/channels/test/records/test')
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Get MAM Error', (done) => {
    const result = new Error('Error');
    transactionStub = sinon.stub(Mam, 'fetchSingle').rejects(result);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .get('/channels/test/records/test')
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });

  it('Get Forbidden Channel', (done) => {
    const res = {};
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/_audit/records/test')
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.body.success).to.equals(false);
        done();
      });
  });

  it('Get Channel Not Found', (done) => {
    const res = {};
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/missing/records/test')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.success).to.equals(false);
        done();
      });
  });

  it('Get Record Not Found', (done) => {
    const res = {};
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/test/records/missing')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.success).to.equals(false);
        done();
      });
  });
});

describe('Audit no Jaeger', () => {
  let transactionStub;
  // res.payload = { succeed: 'true' };
  // res.nextRoot = 'test';

  afterEach((done) => {
    transactionStub.restore();
    done();
  });

  it('Audit Record', (done) => {
    const res = {};
    res.payload = asciiToTrytes('{ "audit": { "payload": { "test": "test" } }, "metadata": { "prevRoot": "TEST" } }');
    const res2 = {};
    res2.payload = asciiToTrytes('{ "audit": { "payload": { "test": "test2" } }, "metadata": { "prevRoot": null } }');
    res2.nextRoot = null;
    transactionStub = sinon.stub(Mam, 'fetchSingle').onCall(0).resolves(res).onCall(1)
      .resolves(res2);
    chai
      .request(app)
      .get('/channels/test/records/test/audit')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.history[0].payload.test).to.equals('test');
        expect(res.body.history[1].payload.test).to.equals('test2');
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledTwice).to.be.true;
        done();
      });
  });
  it('Audit Fail Query', (done) => {
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').resolves(null);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .get('/channels/test/records/test/audit')
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledOnce).to.be.true;
        done();
      });
  });
  it('Audit Fail Query Loop', (done) => {
    const res = { audit: { payload: { test: 'test' } }, metadata: { prevRoot: 'TEST' } };
    transactionStub = sinon.stub(transaction, 'getMAMTransaction').onCall(0).resolves(res).onCall(1)
      .resolves(null);
    // eslint-disable-next-line global-require
    chai
      .request(app)
      .get('/channels/test/records/test/audit')
      .end((err, res) => {
        expect(res).to.have.status(502);
        expect(res.body.success).to.equals(false);
        // eslint-disable-next-line no-unused-expressions
        expect(transactionStub.calledTwice).to.be.true;
        done();
      });
  });

  it('Audit Forbidden Channel', (done) => {
    const res = {};
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/_audit/records/test/audit')
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.body.success).to.equals(false);
        done();
      });
  });

  it('Audit Channel Not Found', (done) => {
    const res = {};
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/missing/records/test/audit')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.success).to.equals(false);
        done();
      });
  });

  it('Audit Record No Found', (done) => {
    const res = {};
    transactionStub = sinon.stub(Mam, 'fetchSingle').resolves(res);
    chai
      .request(app)
      .get('/channels/test/records/missing/audit')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.success).to.equals(false);
        done();
      });
  });
});
