
"use strict";

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const parse = require('jsdoc-parse');
const Documentation = require("../docs");


class Docs {

  constructor(data) {
    this.data = data;
    this.docs = {};

    console.log("Caching docs...");

    for (let repo in data.repos) {
      console.log("Caching docs for repo: " + repo);

      this.cacheDocs(repo);
    }

    console.log("Finished caching docs.");

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
    
    stream.on("error", (err) => {
      console.log("Error while parsing docs: " + err);
    });

    stream.on("end", () => {
      console.log("Finished caching docs.");

      data = JSON.parse(data);
      this.docs[repo] = new Documentation(data, {});
    });
  }

}


module.exports = Docs;
