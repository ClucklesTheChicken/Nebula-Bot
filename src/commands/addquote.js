const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addquote')
    .setDescription('Adds a quote to one of the Nebula members.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The name of the Nebula member.')
        .setRequired(true)
        .addChoices({name:'Cluckles', value:'cluckles'},{name:'GamerXRAY', value:'gamerxray'},{name:'Shamslop', value:'shamslop'})
    )
    .addStringOption(option =>
      option
        .setName('quote')
        .setDescription('Add your quote here!')
        .setRequired(true),
    ),
  async execute(interaction) {
    if(!interaction.member.roles.cache.has("1119275407515062334")){
      interaction.reply(`Sorry you don't have permission to do that.`);
    }
    else{
        const file = require(JSONpath);
        let quoteName = null;
        let allQuotes = null;
        if(interaction.options.get('name')){
            quoteName = interaction.options.get('name').value ? interaction.options.get('name').value : null;
        }
        if(interaction.options.get('quote')){
            quoteAdd = interaction.options.get('quote').value ? interaction.options.get('quote').value : null;
        }
        allQuotes = file.quotes[quoteName].quotes;
        allQuotes.push(quoteAdd);
        
        file.quotes[quoteName].quotes =  allQuotes;
            
        fs.writeFile(JSONpath, JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
        console.log('writing to ' + JSONpath);
        });
        interaction.reply('Successfully added quote!');
    }
   
  },
};