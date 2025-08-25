const Replicate = require("replicate");

const token = process.env.REPLICATE_API_TOKEN;
if (!token) {
  console.warn("[replicateClient] REPLICATE_API_TOKEN not set. Hosted features disabled.");
}

// Node 18+ has global fetch. We set fileEncodingStrategy so Buffers/Streams are uploaded.
const replicate = new Replicate({
  auth: token,
  fileEncodingStrategy: "upload",
});

module.exports = replicate;
