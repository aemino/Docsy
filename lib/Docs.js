
"use strict";

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const child_process = require('child_process');

const parse = require('jsdoc-parse');
const Documentation = require("../docs");


class Docs {

  constructor(data) {
    this.data = data;
    this.docs = {};

    console.log("Decompressing docs...");

    for (let docs in data.docs) {
      console.log("Decompresing docs: " + docs);

      let content = zlib.inflateSync(data.docs[docs]);
      data.docs[docs] = JSON.parse(content.toString());

      this.docs[docs] = new Documentation(data.docs[docs], {});
    }

    console.log("Finished decompressing docs.");

    if (!fs.existsSync('./repos')) {
      console.log("No repos directory found; creating...");
      fs.mkdirSync('./repos');
    }
  }

  init(repo) {
    const repoData = this.data.repos[repo];

    if (fs.existsSync(`./repos/${repoData.repo}`)) return;

    console.log(`Cloning repo ${repo}...`);

    child_process.execSync(`git clone -b ${repoData.branch} --single-branch https://github.com/${repoData.owner}/${repoData.repo}.git`, {
      cwd: path.resolve(__dirname, '../repos')
    });

    this.cacheDocs(repo);
  }

  update(repo) {
    const repoData = this.data.repos[repo];

    console.log(`Pulling repo ${repo}...`);

    child_process.execSync(`git pull`, {
      cwd: path.resolve(__dirname, '../repos', repoData.repo)
    });

    this.cacheDocs(repo);
  }

  cacheDocs(repo) {
    const repoData = this.data.repos[repo];
    const sourcePath = path.resolve(__dirname, '../repos', repoData.repo, repoData.path, '**');

    console.log("Caching docs at path: " + sourcePath);

    let data = "";
    let stream = parse({ src: sourcePath });

    stream.on("data", chunk => data += chunk);
    stream.on("end", () => {
      console.log("Finished caching docs.");

      data = JSON.parse(data);
      this.data.docs[repo] = data;

      this.docs[repo] = new Documentation(data, {});
    });
  }

}


module.exports = Docs;
