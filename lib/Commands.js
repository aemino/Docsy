
"use strict";

const config = require('../config');

const util = require('util');
const child_process = require('child_process');

const beautify = require('js-beautify').js_beautify;


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

    if (this.data.repos.hasOwnProperty(repoFullName)) {
      return message.channel.sendMessage(`${config.emojis.success} Successfully initialized for cached repository **${repoFullName}**.`);
    }

    this.data.repos[repoFullName] = {
      fullName: repoFullName,
      owner: owner,
      repo: repo,
      branch: branch,
      path: path
    };

    this.docs.init(repoFullName)
    .then(() => {
      message.channel.sendMessage(`${config.emojis.success} Successfully initialized for repository **${repoFullName}** with path \`${path}\`.`);
    })
    .catch((err) => {
      delete this.data.channels[message.channel.id];
      delete this.data.repos[repoFullName];

      message.channel.sendMessage(`${config.emojis.warn} Failed to initialize repository. Error occurred: \`${err}\``);
    });
  }


  cease(message, channelID) {
    delete this.data.channels[channelID];

    message.channel.sendMessage(`${config.emojis.success} Successfully **ceased** in \`#${message.channel.name}\`.`);
  }

  remove(message, channelID) {
    const repo = this.data.channels[channelID].repo;

    console.log(`Removing repo ${repo}`);

    for (let channel in this.data.channels) {
      if (this.data.channels[channel].repo === repo) {
        delete this.data.channels[channel];
        console.log(`Deleted channel ${channel}`);
      }
    }

    delete this.data.repos[repo];

    message.channel.sendMessage(`${config.emojis.success} Successfully **deleted** repository.`);
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

  update(message) {
    message.channel.sendMessage(`${config.emojis.success} Updated!`).then(() => {
      child_process.execSync('git pull');
    });
  }

  beautify(message) {
    let messages = message.channel.messages.array().reverse().filter(msg => msg.author.id !== message.client.user.id);
    let code;

    let codeRegex = /```(?:js|json|javascript)?\n((?:\n|.)+?)\n?```/ig;

    for (let m = 0; m < messages.length; m++) {
      let msg = messages[m];
      let groups = codeRegex.exec(msg.content);

      if (groups && groups[1] && groups[1].length) {
        code = groups[1];
        break;
      }
    }

    if (!code) {
      return message.channel.sendMessage(`${config.emojis.warn} No JavaScript code blocks found.`);
    }

    let beautifiedCode = beautify(code, { indent_size: 2, brace_style: 'none' });
    beautifiedCode = this.reduceIndentation(beautifiedCode);

    message.channel.sendMessage(`${'```js'}\n${beautifiedCode}\n${'```'}`);
  }

  reduceIndentation(string) {
    let whitespace = string.match(/^(\s+)/)[0].replace('\n', '');

    let lines = string.split('\n');
    let reformattedLines = [];

    lines.forEach((line) => {
      reformattedLines.push(line.replace(whitespace, ''));
    });

    return reformattedLines.join('\n');
  }

}


module.exports = Commands;
