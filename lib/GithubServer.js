
"use strict";

const config = require('../config');

const crypto = require('crypto');

const express = require('express');
const bodyParser = require('body-parser');



class GithubServer {

  constructor(docs) {
    this.docs = docs;

    const app = express();
    app.use(bodyParser);

    app.post('/hooks/github', this.verifyMiddleware, (req, res) => {
      if (req.headers['x-github-event'] !== 'push') return res.status(200).end();

      const payload = req.body
          , repo = payload.repository.full_name
          , branch = payload.ref.split('/').pop();

      console.log(`GitHub webhook: got pull payload: ${repo}/${branch}`);

      docs.update(`${repo}#${branch}`);
    });

    app.listen(config.port);
  }

  get verifyMiddleware() {
    return bodyParser.json({verify: this.verify});
  }

  signBlob(key, blob) {
    return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex');
  }

  verify(req, res, buffer) {
    if (!req.headers['x-hub-signature'])
      throw new Error('No X-Hub-Signature found on request');

    if (!req.headers['x-github-event'])
      throw new Error('No X-Github-Event found on request');

    if (!req.headers['x-github-delivery'])
      throw new Error('No X-Github-Delivery found on request');

    var received_sig = req.headers['x-hub-signature'];
    var computed_sig = this.signBlob(config.github.secret, buffer);

    if (received_sig != computed_sig) {
      console.warn('Recieved an invalid HMAC: calculated:' +
        computed_sig + ' != recieved:' + received_sig);
      throw new Error('Invalid signature');
    }
  }

}


module.exports = GithubServer;
