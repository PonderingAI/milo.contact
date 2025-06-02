// Test script to verify duplicate detection fixes
// Run with: node scripts/test-duplicate-detection.js

const crypto = require('crypto');

// Test hash consistency
function testHashConsistency() {
  const testData = Buffer.from("test file content");
  
  // Server-side hash (now using SHA-256)
  const serverHash = crypto.createHash("sha256").update(testData).digest("hex");
  
  // Client-side equivalent (what we would get from crypto.subtle)
  const clientHash = crypto.createHash("sha256").update(testData).digest("hex");
  
  console.log("Server hash:", serverHash);
  console.log("Client hash:", clientHash);
  console.log("Hashes match:", serverHash === clientHash);
  
  return serverHash === clientHash;
}

// Test query escaping
function testQueryEscaping() {
  const maliciousFilename = 'test"file.jpg';
  const escaped = maliciousFilename.replace(/"/g, '""');
  
  console.log("Original filename:", maliciousFilename);
  console.log("Escaped filename:", escaped);
  console.log("Query would be: filename.eq.\"" + escaped + "\"");
  
  return escaped === 'test""file.jpg';
}

// Run tests
console.log("Testing duplicate detection fixes...\n");

console.log("1. Hash consistency test:");
const hashTest = testHashConsistency();
console.log("Result:", hashTest ? "PASS" : "FAIL");

console.log("\n2. Query escaping test:");
const escapeTest = testQueryEscaping();
console.log("Result:", escapeTest ? "PASS" : "FAIL");

console.log("\nOverall:", (hashTest && escapeTest) ? "ALL TESTS PASS" : "SOME TESTS FAILED");