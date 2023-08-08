const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dadjoke')
    .setDescription('Replies with a random dad joke!'),
  async execute(interaction) {
    var joke = null;
    request.get({
        url: 'https://api.api-ninjas.com/v1/dadjokes?limit=1',
        headers: {
            'X-Api-Key': process.env.NINJA_API
        },
    }, function(error, response, body) {
    if(error) return console.error('Request failed:', error);
    else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
    else {
        joke = JSON.parse(body); 
        joke = joke[0].joke;
        interaction.reply(joke);
    }
    });
  },
};