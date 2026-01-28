const express = require("express");
const cors = require("cors");
const path = require("path");
const plugins = require("./plugins.json");

const app = express();
const port = process.env.PORT || 3009;

app.use(cors());

app.enable("trust proxy");

app.use((req, res, next) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.get("/wams", (req, res) => {
  res.send(plugins.map((plugin) => `${req.protocol}://${req.get("Host")}/plugins/${plugin}/`));
});

app.get("/plugins.json", (req, res) => {
  res.json(plugins);
});

app.use("/", express.static(path.join(__dirname, "./PedalBoard")));

app.use("/plugins", express.static(path.join(__dirname, "./plugins")));

// Use HTTPS only in local development
if (process.env.NODE_ENV !== 'production') {
  const https = require('https');
  const fs = require('fs');

  try {
    const options = {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem')
    };

    https.createServer(options, app).listen(port, '0.0.0.0', () => {
      console.log(`BUKA PEDALBOARD Secure Server running on https://0.0.0.0:${port}`);
      console.log(`Access from PC: https://localhost:${port}`);
      console.log(`Access from Mobile: https://192.168.0.72:${port}`);
    });
  } catch (err) {
    console.log('SSL certificates not found, starting HTTP server...');
    app.listen(port, '0.0.0.0', () => {
      console.log(`BUKA PEDALBOARD Server running on http://0.0.0.0:${port}`);
    });
  }
} else {
  // Production: Render handles SSL
  app.listen(port, '0.0.0.0', () => {
    console.log(`BUKA PEDALBOARD Server running on port ${port}`);
  });
}
