const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('randomquote')
    .setDescription('Replies with a random quote!'),
  async execute(interaction) {
        var randomquote = null;
        request.get({
            url: 'https://api.api-ninjas.com/v1/quotes?category=',
            headers: {
                'X-Api-Key': process.env.NINJA_API
            },
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            randomquote = JSON.parse(body); 
            randomquote = randomquote[0].quote;
            quoteauthor = randomquote[0].author ? randomquote[0].author : 'Unknown';
            interaction.reply(`\"${randomquote}\" (${quoteauthor})`);
        }
        });
  },
};