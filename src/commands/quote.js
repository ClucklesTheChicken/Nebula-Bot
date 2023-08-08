const { SlashCommandBuilder } = require('@discordjs/builders');
const { readFileSync } = require("fs");
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Replies with a random quote from one of the Nebula members.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The name of the Nebula member.')
        .setRequired(false)
        .addChoices({name:'Cluckles', value:'cluckles'},{name:'GamerXRAY', value:'gamerxray'},{name:'Shamslop', value:'shamslop'}),
    ),
  async execute(interaction) {
    if(!interaction.member.roles.cache.has("1119275407515062334")){
      await interaction.reply(`Sorry you don't have permission to do that.`);
    }
    else{
        let quotesJSONString = readFileSync(JSONpath);
        let quotesJSON = JSON.parse(quotesJSONString);
        let quoteName = null;
        if(interaction.options.get('name')){
            quoteName = interaction.options.get('name').value ? interaction.options.get('name').value : null;
        }
        let allQuotes = null;
        let returnQuote = null;
        if(quoteName == null){
            //allQuotes = quotesJSON.quotes[quoteName];
            var obj_keys = Object.keys(quotesJSON.quotes);
            var ran_key = obj_keys[Math.floor(Math.random() *obj_keys.length)];
            allQuotes = quotesJSON.quotes[ran_key].quotes;
            returnQuote = allQuotes[(Math.floor(Math.random() * allQuotes.length))];
            await interaction.reply(`"${returnQuote}" - ${quotesJSON.quotes[ran_key].name}`); 
        }
        else{
            allQuotes = quotesJSON.quotes[quoteName].quotes;
            returnQuote = allQuotes[(Math.floor(Math.random() * allQuotes.length))];
            if(returnQuote !== null){
              await interaction.reply(`"${returnQuote}" - ${quotesJSON.quotes[quoteName].name}`); 
            }
            else{
              await interaction.reply("The bot is experiencing technical difficulties. Reach out to your nearest friend and ask for a hug."); 
            }
        }
    }
  },
};