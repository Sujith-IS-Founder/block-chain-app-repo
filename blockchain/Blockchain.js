const crypto = require("crypto"); // Built-in Node.js module for creating secure hashes

// Define a single block in the blockchain
class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index; // Position of the block in the chain
    this.timestamp = timestamp; // When the block was created
    this.data = data; // Actual data: vote (voterId, candidate)
    this.previousHash = previousHash; // Hash of the previous block (ensures chain linkage)
    this.hash = this.calculateHash(); // Hash of this block (used for validation)
  }

  // Method to generate the SHA-256 hash for the block
  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.timestamp +
          JSON.stringify(this.data) +
          this.previousHash
      )
      .digest("hex"); // Converts the hash to a readable hex string
  }
}

// Blockchain class: manages the chain of blocks and voting logic
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()]; // Start chain with the Genesis (first) block
    this.votedIds = new Set(); // To track voter IDs and prevent duplicate voting
  }

  // Genesis block: hardcoded, first block with dummy data
  createGenesisBlock() {
    return new Block(0, Date.now().toString(), "Genesis Block", "0");
  }

  // Get the latest block on the chain
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Add a new vote (block) to the chain
  addVote(data) {
    if (this.votedIds.has(data.voterId)) {
      // Prevent double voting
      return { success: false, message: "Duplicate vote!" };
    }

    // Create a new block with the new vote
    const newBlock = new Block(
      this.chain.length,
      Date.now().toString(),
      data,
      this.getLatestBlock().hash
    );

    // Add the block to the chain
    this.chain.push(newBlock);

    // Record the voter ID to prevent future duplicate votes
    this.votedIds.add(data.voterId);

    return { success: true, block: newBlock };
  }

  // Count votes by tallying how many times each candidate appears
  getResults() {
    const votes = {};
    for (const block of this.chain.slice(1)) {
      // Skip the Genesis block
      const candidate = block.data.candidate;
      votes[candidate] = (votes[candidate] || 0) + 1;
    }
    return votes;
  }

  // Validate the chain’s integrity
  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check if current block hash is still valid
      if (current.hash !== current.calculateHash()) return false;

      // Check if the chain is properly linked
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

module.exports = Blockchain; // Export for use in other files
