
"use strict";

const path = require('path');
const child_process = require('child_process');

const parse = require('jsdoc-parse');


class Docs {

  constructor(data) {
    this.data = data;
    this.docs = {};
  }

  init(repo) {
    console.log(`Cloning repo ${repo}...`);

    child_process.spawnSync('git', ['clone', repo], {
      cwd: path.resolve(__dirname, '../repos')
    });

    this.cacheDocs(repo);
  }

  update(repo) {
    console.log(`Pulling repo ${repo}...`);

    child_process.spawnSync('git', ['pull', repo], {
      cwd: path.resolve(__dirname, '../repos')
    });

    this.cacheDocs(repo);
  }

  cacheDocs(repo) {
    let data = "";
    let stream = parse({ src: path.resolve(__dirname, '../repos', this.data.repos[repo].path, '**') });

    stream.on("data", chunk => data += chunk);
    stream.on("end", () => {
      data = JSON.parse(data);
      this.data.docs[repo] = data;
    });
  }

}


module.exports = Docs;
