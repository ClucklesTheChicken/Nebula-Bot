const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('funfact')
    .setDescription('Replies with a random fun fact!'),
  async execute(interaction) {
    var fact = null;
        request.get({
            url: 'https://api.api-ninjas.com/v1/facts?limit=1',
            headers: {
                'X-Api-Key': process.env.NINJA_API
            },
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            fact = JSON.parse(body); 
            fact = fact[0].fact;
            interaction.reply(fact);
        }
        });
  },
};