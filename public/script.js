// Function to send the vote to the server
async function submitVote() {
  const voterId = document.getElementById("voterId").value;
  const candidate = document.getElementById("candidate").value;

  // Send vote to backend API
  const res = await fetch("/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voterId, candidate }), // Send vote as JSON
  });

  const data = await res.json();

  // Show success/failure message
  alert(data.success ? "Vote submitted!" : data.message);

  // Update results after voting
  fetchResults();
}

// Fetch the vote tally from backend
async function fetchResults() {
  const res = await fetch("/results");
  const data = await res.json();

  // Display results in the HTML
  document.getElementById("results").textContent = JSON.stringify(
    data,
    null,
    2
  );
}

// Load current results on page load
fetchResults();
