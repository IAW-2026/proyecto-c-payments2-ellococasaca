const crypto = require('crypto');
const secret = "801f5e360d0ae1890fa4d6db1c636ddfeea3ba4ca2e56c686da6481afb7d3330";
const variants = [
  "id:160258266960;request-id:ab309fc5-3758-4cd7-aa95-cc1e813f82ab;ts:1779331498;",
  "id:160258266960;request-id:ab309fc5-3758-4cd7-aa95-cc1e813f82ab;ts:1779331498",
  "id: 160258266960;request-id: ab309fc5-3758-4cd7-aa95-cc1e813f82ab;ts: 1779331498;",
  "id:160258266960;request-id:ab309fc5-3758-4cd7-aa95-cc1e813f82ab;ts:1779331498;type:payment;",
];

variants.forEach((v) => {
  const sha = crypto.createHmac('sha256', secret).update(v).digest('hex');
  console.log("Variant:", v);
  console.log("Hash:", sha);
});
console.log("Expected:", "d3a643943abf48f788dd2bfafb59cd02e984e13a06747c02f3b832eca47b7a65");
