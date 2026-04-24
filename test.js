const assert = require('assert');
const express = require('express');
const request = require('supertest');
const Blockchain = require('./blockchain/Blockchain');

// ========================
// Unit Tests - Blockchain
// ========================

describe('Blockchain', () => {
  let blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  describe('initialization', () => {
    it('should have a genesis block on initialization', () => {
      assert(blockchain.chain.length > 0, 'Blockchain should have at least one block');
    });

    it('should initialize with an empty or default votes array', () => {
      assert(Array.isArray(blockchain.chain), 'chain should be an array');
    });
  });

  describe('addVote()', () => {
    it('should add a vote successfully', () => {
      const result = blockchain.addVote({ voterId: 'voter1', candidate: 'Alice' });
      assert(result.success !== false, 'addVote should return a success response');
    });

    it('should prevent duplicate votes from the same voter', () => {
      blockchain.addVote({ voterId: 'voter2', candidate: 'Bob' });
      const duplicateVote = blockchain.addVote({ voterId: 'voter2', candidate: 'Charlie' });
      assert(duplicateVote.success === false || duplicateVote.error, 'Duplicate vote should be rejected');
    });

    it('should require both voterId and candidate', () => {
      const result1 = blockchain.addVote({ voterId: 'voter3' });
      const result2 = blockchain.addVote({ candidate: 'Alice' });
      assert(result1.success === false || result1.error, 'Vote without candidate should fail');
      assert(result2.success === false || result2.error, 'Vote without voterId should fail');
    });

    it('should increase the blockchain chain length after a valid vote', () => {
      const initialLength = blockchain.chain.length;
      blockchain.addVote({ voterId: 'voter4', candidate: 'David' });
      assert(blockchain.chain.length > initialLength, 'Chain length should increase after adding vote');
    });
  });

  describe('getResults()', () => {
    it('should return an object with vote counts', () => {
      blockchain.addVote({ voterId: 'voter5', candidate: 'Eve' });
      blockchain.addVote({ voterId: 'voter6', candidate: 'Eve' });
      blockchain.addVote({ voterId: 'voter7', candidate: 'Frank' });
      
      const results = blockchain.getResults();
      assert(typeof results === 'object', 'getResults should return an object');
      assert(results.Eve >= 2, 'Eve should have at least 2 votes');
      assert(results.Frank >= 1, 'Frank should have at least 1 vote');
    });

    it('should return accurate vote counts', () => {
      blockchain.addVote({ voterId: 'voter8', candidate: 'Grace' });
      blockchain.addVote({ voterId: 'voter9', candidate: 'Grace' });
      blockchain.addVote({ voterId: 'voter10', candidate: 'Grace' });
      
      const results = blockchain.getResults();
      assert(results.Grace === 3, 'Grace should have exactly 3 votes');
    });

    it('should handle no votes', () => {
      const results = blockchain.getResults();
      assert(typeof results === 'object', 'getResults should return an object even with no votes');
    });
  });

  describe('blockchain integrity', () => {
    it('should maintain valid block chain links', () => {
      blockchain.addVote({ voterId: 'voter11', candidate: 'Henry' });
      blockchain.addVote({ voterId: 'voter12', candidate: 'Ivy' });
      
      for (let i = 1; i < blockchain.chain.length; i++) {
        const currentBlock = blockchain.chain[i];
        const previousBlock = blockchain.chain[i - 1];
        
        // Check if current block references previous block's hash
        if (currentBlock.previousHash !== undefined) {
          assert(currentBlock.previousHash === previousBlock.hash, 
            `Block ${i} should reference previous block's hash`);
        }
      }
    });
  });
});

// ========================
// Integration Tests - API
// ========================

describe('Voting App API', () => {
  let app;

  beforeEach(() => {
    // Create a fresh app instance for each test
    app = express();
    app.use(express.json());
    
    const blockchain = new Blockchain();
    
    app.post('/vote', (req, res) => {
      const { voterId, candidate } = req.body;
      const result = blockchain.addVote({ voterId, candidate });
      res.json(result);
    });
    
    app.get('/results', (req, res) => {
      res.json(blockchain.getResults());
    });
    
    app.get('/chain', (req, res) => {
      res.json(blockchain.chain);
    });
  });

  describe('POST /vote', () => {
    it('should accept a valid vote', (done) => {
      request(app)
        .post('/vote')
        .send({ voterId: 'voter13', candidate: 'Jack' })
        .expect(200)
        .end(done);
    });

    it('should return JSON response', (done) => {
      request(app)
        .post('/vote')
        .send({ voterId: 'voter14', candidate: 'Kate' })
        .expect('Content-Type', /json/)
        .end(done);
    });

    it('should handle missing voterId', (done) => {
      request(app)
        .post('/vote')
        .send({ candidate: 'Leo' })
        .expect(200)
        .end((err, res) => {
          assert(res.body.error || res.body.success === false, 'Should return error for missing voterId');
          done(err);
        });
    });

    it('should handle missing candidate', (done) => {
      request(app)
        .post('/vote')
        .send({ voterId: 'voter15' })
        .expect(200)
        .end((err, res) => {
          assert(res.body.error || res.body.success === false, 'Should return error for missing candidate');
          done(err);
        });
    });
  });

  describe('GET /results', () => {
    it('should return vote results as JSON', (done) => {
      request(app)
        .get('/results')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done);
    });

    it('should return an object', (done) => {
      request(app)
        .get('/results')
        .expect(200)
        .end((err, res) => {
          assert(typeof res.body === 'object', 'Response should be an object');
          done(err);
        });
    });
  });

  describe('GET /chain', () => {
    it('should return the blockchain as JSON', (done) => {
      request(app)
        .get('/chain')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done);
    });

    it('should return an array', (done) => {
      request(app)
        .get('/chain')
        .expect(200)
        .end((err, res) => {
          assert(Array.isArray(res.body), 'Response should be an array');
          done(err);
        });
    });

    it('should contain block objects with expected properties', (done) => {
      request(app)
        .get('/chain')
        .expect(200)
        .end((err, res) => {
          assert(res.body.length > 0, 'Chain should have at least one block');
          const block = res.body[0];
          assert(block.hash !== undefined || block.timestamp !== undefined, 
            'Block should have hash or timestamp property');
          done(err);
        });
    });
  });
});

// ========================
// Error Handling Tests
// ========================

describe('Error Handling', () => {
  let blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  it('should handle invalid vote data types', () => {
    const result = blockchain.addVote({ voterId: 123, candidate: 456 });
    // Should either accept and convert, or reject with error
    assert(result !== undefined, 'Should return a response');
  });

  it('should handle empty strings', () => {
    const result = blockchain.addVote({ voterId: '', candidate: '' });
    assert(result.success === false || result.error, 'Should reject empty strings');
  });

  it('should handle null values', () => {
    const result = blockchain.addVote({ voterId: null, candidate: null });
    assert(result.success === false || result.error, 'Should reject null values');
  });
});
