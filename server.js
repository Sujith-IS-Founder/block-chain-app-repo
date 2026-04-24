const express = require("express"); // Web framework for creating API endpoints
const app = express(); // Initialize app
const Blockchain = require("./blockchain/Blockchain"); // Import our blockchain logic
const votingChain = new Blockchain(); // Create a new instance of the voting blockchain

app.use(express.json()); // To parse JSON body in POST requests
app.use(express.static("public")); // Serve frontend files (HTML, JS) from 'public' folder

// Handle vote submissions
app.post("/vote", (req, res) => {
  const { voterId, candidate } = req.body; // Extract voter input from the request
  const result = votingChain.addVote({ voterId, candidate }); // Add vote to blockchain
  res.json(result); // Return success/failure and data
});

// Send current vote results
app.get("/results", (req, res) => {
  res.json(votingChain.getResults()); // Send candidate vote counts
});

// Send entire blockchain (all blocks)
app.get("/chain", (req, res) => {
  res.json(votingChain.chain); // Useful for debugging or showing the full chain
});

// Start server
app.listen(3000, () => {
  console.log("Voting app running at http://localhost:3000");
});
