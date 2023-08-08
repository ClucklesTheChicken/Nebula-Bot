const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bite')
    .setDescription('Bites someone. I dont know why you would want to, but sure, I guess')
    .addUserOption(option =>
      option
        .setName('recipient')
        .setDescription('Who you would like to bite')
        .setRequired(true),
    ),
  async execute(interaction) {
    var gif = null;
        request.get({
            url: 'https://api.otakugifs.xyz/gif?reaction=bite'
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            gif = JSON.parse(body); 
            interaction.reply(`${interaction.user} bit ${interaction.options.getUser('recipient')}... Why? \n ${gif.url}`);
        }
        });
  },
};