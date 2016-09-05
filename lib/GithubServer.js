
"use strict";

const config = require('../config');

const crypto = require('crypto');
const child_process = require('child_process');

const express = require('express');
const bodyParser = require('body-parser');



class GithubServer {

  constructor(data, docs) {
    this.data = data;
    this.docs = docs;

    const app = express();
    app.use(bodyParser);
    app.use((req, res, next) => {
      console.log("Got request: " + req.originalUrl);
      next();
    });

    app.post('/hooks/github', this.verifyRequest, (req, res) => {
      if (req.headers['x-github-event'] !== 'push') return res.status(200).json({ ok: true });

      const payload = req.body
          , repo = payload.repository.full_name
          , branch = payload.ref.split('/').pop();

      const repoName = `${repo}#${branch}`;

      console.log(`GitHub webhook: got pull payload: ${repoName}`);

      if (this.data.repos.hasOwnProperty(repoName))
        return docs.update(repoName);

      if (repoName === "Programmix/Docsy#master") {
        child_process.execSync('git pull');
      }

      res.status(200).json({ ok: true });
    });

    app.listen(config.port, () => {
      console.log(`Server started on port ${config.port}.`);
    });
  }

  verifyRequest(req, res, next) {
    this.verify()
    .then(next)
    .catch((err) => {
      res.status(400).json({ error: err });
    });
  }

  signBlob(key, blob) {
    return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex');
  }

  verify(req, res) {
    return new Promise((resolve, reject) => {
      if (!req.headers['x-hub-signature'])
        reject(new Error('No X-Hub-Signature found on request'));

      if (!req.headers['x-github-event'])
        reject(new Error('No X-Github-Event found on request'));

      if (!req.headers['x-github-delivery'])
        reject(new Error('No X-Github-Delivery found on request'));

      var received_sig = req.headers['x-hub-signature'];
      var computed_sig = this.signBlob(config.github.secret, res.body);

      if (received_sig != computed_sig) {
        console.warn('Recieved an invalid HMAC: calculated:' +
          computed_sig + ' != recieved:' + received_sig);
        reject(new Error('Invalid signature'));
      }

      resolve();
    });
  }

}


module.exports = GithubServer;
