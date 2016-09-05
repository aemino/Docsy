
"use strict";

const config = require('./config');
const data   = require('./data');

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const Discord = require('discord.js');

const Docs = require('./lib/Docs');
const Commands = require('./lib/Commands');
const GithubServer = require('./lib/GithubServer');


const client = new Discord.Client();

const docs = new Docs(data);
const commands = new Commands(data, docs);
const server = new GithubServer(docs);


client.on("message", (message) => {
  const trigger = client.user.username.toLowerCase() + ", ";

  if (!message.content.toLowerCase().startsWith(trigger)) return;

  const params  = message.content.split(" ").splice(1);
  const command = params[0].toLowerCase();
  const args    = params.splice(1);

  if (message.author.id === config.admin) {
    if (command === "init") {

      if (data.channels.hasOwnProperty(message.channel.id)) {
        return message.channel.sendMessage(`${config.emojis.success} Already initialized.`);
      }

      // parse owner/repo#branch

      const gitsrc  = args[0].split('#');
      const gitrepo = gitsrc[0].split('/');
      const owner   = gitrepo[0];
      const repo    = gitrepo[1];
      const branch  = gitsrc[1] || 'master';
      const path    = args[1];

      if (!owner || !repo || !branch || !path) {
        return message.channel.sendMessage(`${config.emojis.warn} Invalid arguments.`);
      }

      message.channel.sendMessage(`${config.emojis.cog} Working...`).then(() => {
        commands.init(message, owner, repo, branch, path);
        save();
      });

      return;
    }

    if (command === "activate") {

      const channelID = message.channel.id;

      if (!data.channels.hasOwnProperty(channelID)) {
        return message.channel.sendMessage(`${config.emojis.warn} Not yet initialized.`);
      }

      if (data.repos[data.channels[channelID].repo].active) {
        return message.channel.sendMessage(`${config.emojis.warn} Already inactive.`);
      }

      commands.setActive(true, message, channelID);
      return save();
    }

    if (command === "deactivate") {

      const channelID = message.channel.id;

      if (!data.channels.hasOwnProperty(channelID)) {
        return message.channel.sendMessage(`${config.emojis.warn} Not yet initialized.`);
      }

      if (!data.repos[data.channels[channelID].repo].active) {
        return message.channel.sendMessage(`${config.emojis.warn} Already active.`);
      }

      commands.setActive(false, message, channelID);
      return save();
    }

    if (command === "cease") {

      const channelID = message.channel.id;

      if (!data.channels.hasOwnProperty(channelID)) {
        return message.channel.sendMessage(`${config.emojis.warn} Not yet initialized.`);
      }

      commands.cease(message, channelID);
      return save();
    }

    if (command === "remove") {

      const channelID = message.channel.id;

      if (!data.channels.hasOwnProperty(channelID)) {
        return message.channel.sendMessage(`${config.emojis.warn} Not yet initialized.`);
      }

      return commands.remove(message, channelID);
    }

    if (command === "eval") {

      const evaluate = args.join(" ");

      return commands.eval(message, evaluate);
    }
  }

  let channel = data.channels[message.channel.id];
  if (!channel || !channel.repo) return;

  let repo = data.repos[channel.repo];
  if (!repo || !repo.active) return;


});

client.on("ready", () => {
  console.log("Connected!");
});

client.on("disconnect", () => {
  console.log("Disconnected.");
});


client.login(config.client.token);
console.log("Logging in...");

function save() {
  let deepClone = (obj) => {
    for (let key in obj) {
      let value = obj[key];

      if (typeof value === "object")
        obj[key] = deepClone(value);
      else
        obj[key] = value;
    }

    return obj;
  };

  let saveData = deepClone(data, {});

  for (let docs in saveData.docs) {
    let content = zlib.deflateSync(JSON.stringify(saveData.docs[docs]));
    saveData.docs[docs] = content;
  }

  fs.writeFileSync('./data.json', JSON.stringify(data));
}

setInterval(save, (60 * 1000)); // autosave

process.on("SIGINT", () => {
  save();
  process.exit();
});
