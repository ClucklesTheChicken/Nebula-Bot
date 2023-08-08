const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lick')
    .setDescription('Honestly I dont know why you would do this, but sure I guess')
    .addUserOption(option =>
      option
        .setName('recipient')
        .setDescription('Who you would like to lick')
        .setRequired(true),
    ),
  async execute(interaction) {
    var gif = null;
        request.get({
            url: 'https://api.otakugifs.xyz/gif?reaction=lick'
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            gif = JSON.parse(body); 
            interaction.reply(`${interaction.user} licked ${interaction.options.getUser('recipient')} .... why? \n ${gif.url}`);
        }
        });
  },
};