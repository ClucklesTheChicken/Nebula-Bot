const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock paper scissors with the bot!')
    .addStringOption(option =>
      option
        .setName('selection')
        .setDescription('Choose Rock, paper or scissors')
        .setRequired(true)
        .addChoices({name:'Rock', value:'rock'},{name:'Paper', value:'paper'},{name:'Scissors', value:'scissors'}),
    ),
  async execute(interaction) {
        let selection = null;
        if(interaction.options.get('selection')){
          selection = interaction.options.get('selection').value ? interaction.options.get('selection').value : null;
        }
        let botSelectionOptions = ['rock','paper','scissors'];
        let botSelection = botSelectionOptions[(Math.floor(Math.random() * botSelectionOptions.length))];
        let outputText = null;
        let outcome = null;
        var gif = null;
        let allSmacks = ['slap','smack','punch'];
        let smack = allSmacks[(Math.floor(Math.random() * allSmacks.length))];

        switch (selection) {
          case 'rock':
            if(botSelection == 'rock'){
              outputText = "The bot chose rock: It's a tie!";
              outcome = 'sigh';
            }
            else if(botSelection == 'paper'){
              outputText = "The bot chose paper: you lose, bitch.";
              outcome = smack;
            }
            else if(botSelection == 'scissors'){
              outputText = "The bot chose scissors: you win! what you want? A noddy badge?";
              outcome = 'celebrate';
            }
            break;
          case 'paper':
            if(botSelection == 'rock'){
              outputText = "The bot chose rock: you win! what you want? A noddy badge?";
              outcome = 'celebrate';
            }
            else if(botSelection == 'paper'){
              outputText = "The bot chose paper: It's a tie!";
              outcome = 'sigh';
            }
            else if(botSelection == 'scissors'){
              outputText = "The bot chose scissors: you lose, bitch.";
              outcome = smack;
            }
            break;
          case 'scissors':
            if(botSelection == 'rock'){
              outputText = "The bot chose rock: you lose, bitch.";
              outcome = smack;
            }
            else if(botSelection == 'paper'){
              outputText = "The bot chose paper: you win! what you want? A noddy badge?";
              outcome = 'celebrate';
            }
            else if(botSelection == 'scissors'){
              outputText = "The bot chose scissors: It's a tie!";
              outcome = 'sigh';
            }
            break;
        }

        request.get({
            url: 'https://api.otakugifs.xyz/gif?reaction='+outcome
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            gif = JSON.parse(body); 
            if(outputText !== null){
              interaction.reply(`${outputText} \n ${gif.url}`);
            }
            else{
              if(outputText !== null){
                interaction.reply(`The bot did a fanny wobble, please try again later`);
              }
            }
        }
        });
        
        
  },
};