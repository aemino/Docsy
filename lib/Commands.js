
"use strict";

const config = require('../config');

const util = require('util');
const child_process = require('child_process');

const request = require('request');


class Commands {

  constructor(data, docs) {
    this.data = data;
    this.docs = docs;
  }

  init(message, owner, repo, branch, path) {
    const repoFullName = `${owner}/${repo}#${branch}`;

    this.data.channels[message.channel.id] = {
      repo: repoFullName
    };

    if (this.data.repos.hasOwnProperty(repoFullName)) return;

    this.data.repos[repoFullName] = {
      fullName: repoFullName,
      owner: owner,
      repo: repo,
      branch: branch,
      path: path
    };

    this.docs.init(repoFullName);

    return message.channel.sendMessage(`${config.emojis.success} Successfully initialized for repository **${repoFullName}** with path \`${path}\`.`);
  }


  cease(message, channelID) {
    delete this.data.channels[channelID];

    return message.channel.sendMessage(`${config.emojis.success} Successfully **ceased** in \`#${message.channel.name}\`.`);
  }

  remove(message, channelID) {
    const repo = this.data.channels[channelID].repo;

    console.log(`Removing repo ${repo}`);

    for (let channel in this.data.channels) {
      if (this.data.channels[channel].repo === repo.fullName) {
        delete this.data.channels[channel];
        console.log(`Deleted channel ${channel}`);
      }
    }

    delete this.data.repos[repo.fullName];

    return message.channel.sendMessage(`${config.emojis.success} Successfully **deleted** repository.`);
  }

  eval(message, evaluate) {
    let result;
    let header;

    console.log(`Evaluating ${evaluate} ...`);

    try {
      result = eval(evaluate);
      header = "**Result**:";
    }
    catch (err) {
      result = err;
      header = "**Error**:";
    }

    result = util.inspect(result);

    if (result.length > 1950)
      result = (result.substring(0, 1950) + "...");

    console.log(`Result: ${result}`);

    let response = `${header}\n${'```js'}\n${result}\n${'```'}`;
    message.channel.sendMessage(response);
  }

  exec(message, command) {
    child_process.execSync(command);
  }

}


module.exports = Commands;
