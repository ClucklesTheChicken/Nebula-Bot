const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('smack')
    .setDescription('Smacks the shit out of someone. Use carefully')
    .addUserOption(option =>
      option
        .setName('recipient')
        .setDescription('Who you would like to smack')
        .setRequired(true),
    ),
  async execute(interaction) {
        var gif = null;
        let allSmacks = ['slap','smack','punch'];
        let smack = allSmacks[(Math.floor(Math.random() * allSmacks.length))];
        request.get({
            url: 'https://api.otakugifs.xyz/gif?reaction='+smack
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            gif = JSON.parse(body); 
            interaction.reply(`${interaction.user} has smacked the shit out of ${interaction.options.getUser('recipient')}. BAD BOI! \n ${gif.url}`);
        }
        });
  },
};