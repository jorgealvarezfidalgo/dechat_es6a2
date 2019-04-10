const path = require("path");

module.exports = {
  entry: "./src/main/ChatController.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "src/main/dist")
  },
  node: {
    "development",
  fs: "empty"
  },
  externals: {
    "node-fetch": "fetch",
    "text-encoding": "TextEncoder",
    "whatwg-url": "window",
    "isomorphic-fetch": "fetch",
    "@trust/webcrypto": "crypto",
    "fs": "empty"
  }
};
