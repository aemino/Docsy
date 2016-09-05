
"use strict";

const config = require('../config');

const util = require('util');

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

    if (this.data.repos.hasOwnProperty(repoFullName) && this.data.repos[repoFullName].id) return;

    this.data.repos[repoFullName] = {
      fullName: repoFullName,
      owner: owner,
      repo: repo,
      branch: branch,
      path: path
    };

    this.docs.init(repoFullName);

    const webhookData = {
      name: 'web',
      config: {
        url: `${config.url}:${config.port}/hooks/github`,
        content_type: 'json',
        secret: config.github.secret
      }
    };

    console.log(`Creating webhook for ${repoFullName}...`);

    request.post(`https://api.github.com/v3/repos/${owner}/${repo}/hooks`, {headers: config.github.headers, json: webhookData}, (err, response, body) => {
      if (err) {
        console.log("Error while creating webhook: " + err);

        delete data.channels[message.channel.id];
        delete data.repos[repoFullName];

        return message.channel.sendMessage("An error occurred while creating webhook.");
      }

      const data = body;

      this.data.repos[repoFullName] = {
        id: data.id,
        active: true,
        fullName: repoFullName,
        owner: owner,
        repo: repo,
        branch: branch,
        path: path
      };

      console.log(`Created webhook for ${repoFullName}.`);
      return message.channel.sendMessage(`${config.emojis.success} Successfully initialized for repository **${repoFullName}** with path \`${path}\`.`);
    });
  }

  setActive(active, message, channelID) {
    const repo = this.data.repos[this.data.channels[channelID].repo];
    const hookID = repo.id;

    const webhookData = {
      active: active
    };

    request.patch(`https://api.github.com/v3/repos/${repo.owner}/${repo.repo}/hooks/${hookID}`, {headers: config.github.headers, json: webhookData}, (err) => {
      if (err) {
        console.log(err);

        return message.channel.sendMessage(`${config.emojis.warn} An error occurred while updating the webhook.`);
      }

      repo.active = active;

      return message.channel.sendMessage(`${config.emojis.success} Successfully set state to **${(active ? "active" : "inactive")}**.`);
    });
  }

  cease(message, channelID) {
    delete this.data.channels[channelID];

    return message.channel.sendMessage(`${config.emojis.success} Successfully **ceased** in \`#${message.channel.name}\`.`);
  }

  remove(message, channelID) {
    const repo = this.data.repos[this.data.channels[channelID].repo];
    const hookID = repo.id;

    request.delete(`https://api.github.com/v3/repos/${repo.owner}/${repo.repo}/hooks/${hookID}`, {headers: config.github.headers}, (err) => {
      if (err) {
        console.log(err);

        return message.channel.sendMessage(`${config.emojis.warn} An error occurred while deleting the webhook.`);
      }

      for (let channel in this.data.channels) {
        let repo = this.data.channels[channel].repo;

        if (repo === repo.fullName)
          delete this.data.channels[channel];
      }

      delete this.data.repos[repo.fullName];

      return message.channel.sendMessage(`${config.emojis.success} Successfully **deleted** hook.`);
    });
  }

  eval(message, evaluate) {
    let result;
    let header;

    console.log(`Evaluating ${evaluate} ...`);

    try {
      result = eval(evaluate);
      header = "**Results**:";
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

}


module.exports = Commands;
