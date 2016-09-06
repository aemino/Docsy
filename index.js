
"use strict";

const config = require('./config');
const data   = require('./data');

const fs   = require('fs');
const path = require('path');

const Discord = require('discord.js');

const Docs = require('./lib/Docs');
const Lookup = require('./lib/Lookup');
const Commands = require('./lib/Commands');
const GithubServer = require('./lib/GithubServer');


const client = new Discord.Client();

const docs     = new Docs(data);
const commands = new Commands(data, docs);
const server   = new GithubServer(data, docs);
const lookup   = new Lookup(data, docs);


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

      if (!args[0] || !args[1]) {
        return message.channel.sendMessage(`${config.emojis.warn} Invalid arguments.`);
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

    if (command === "exec") {

      const cmd = args.join(" ");

      return commands.exec(message, cmd);
    }

    if (command === "update") {

      return commands.update(message);
    }

  }

  if (command === "beautify") {

    return commands.beautify(message);
  }


  lookup.respond(message, params);
});

client.on("ready", () => {
  console.log("Connected!");

  client.user.setStatus("online", config.client.status);
});

client.on("disconnect", () => {
  console.log("Disconnected.");
});


client.login(config.client.token);
console.log("Logging in...");

function save() {
  fs.writeFileSync('./data.json', JSON.stringify(data));
}

setInterval(save, (60 * 1000)); // autosave

process.on("SIGINT", () => {
  save();
  process.exit();
});
