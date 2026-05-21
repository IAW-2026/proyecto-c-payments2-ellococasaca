const crypto = require('crypto');
const manifest = "id:160258266960;request-id:ab309fc5-3758-4cd7-aa95-cc1e813f82ab;ts:1779331498;";
const secret = "801f5e360d0ae1890fa4d6db1c636ddfeea3ba4ca2e56c686da6481afb7d3330";
const hmac = crypto.createHmac('sha256', secret);
hmac.update(manifest);
const sha = hmac.digest('hex');
console.log("Calculated:", sha);
console.log("Expected:  d3a643943abf48f788dd2bfafb59cd02e984e13a06747c02f3b832eca47b7a65");
console.log("Node HASH: 722a0e5f0d255b95a3ab26cc42242ae1248179089b853f7f6022550671365fa0");
