// Node.js can run JavaScript without a browser!
console.log("Hello from Node.js!");

const fs   = require('fs');
const path = require('path');
const os   = require('os');

console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Directory:", process.cwd());
console.log("File extension example:", path.extname('photo.jpg'));
console.log("OS Platform:", os.platform());

// Write and read a file
fs.writeFileSync('output.txt', 'Hello, World!');
console.log("output.txt created!");
console.log("Content:", fs.readFileSync('output.txt', 'utf-8'));
