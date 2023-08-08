const { SlashCommandBuilder } = require('@discordjs/builders');
const { readFileSync } = require("fs");
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice!')
    .addIntegerOption(option =>
      option
        .setName('number')
        .setDescription('The number of dice')
        .setRequired(true),
    )
    .addIntegerOption(option =>
      option
        .setName('dice')
        .setDescription('Which dice you would like to roll')
        .setRequired(true)
        .addChoices({name:'d2', value:2},{name:'d3', value:3},{name:'d4', value:4},{name:'d6', value:6},{name:'d8', value:8},{name:'d10', value:10},{name:'d12', value:12},{name:'d20', value:20},{name:'d100', value:100}),
    ),
  async execute(interaction) {
    if(!interaction.member.roles.cache.has("1119275407515062334")){
      await interaction.reply(`Sorry you don't have permission to do that.`);
    }
    else{
        let number = null;
        let dice = null;
        let diceValue = null;
        if(interaction.options.get('number')){
            number = interaction.options.get('number').value ? interaction.options.get('number').value : null;
        }
        if(interaction.options.get('dice')){
            dice = interaction.options.get('dice').value ? interaction.options.get('dice').value : null;
            diceValue = interaction.options.get('dice').value ? interaction.options.get('dice').value : null;
        }
        if(number !== null && diceValue !== null){
          if(number == 0){
            await interaction.reply("Why are you trying to roll zero dice? ARE YOU INSANE?");
          }
          else{
            let rolls = [];
            let roll = null;
            let total = 0;
            let result = null;
            let resultText = null;
            
            for (let i = 0; i < number; i++) {
              roll = Math.floor(Math.random() * diceValue) + 1 ;
              total += roll;
              rolls.push(roll);
              if(i == 0){
                resultText = roll;
              }
              else{
                resultText = resultText+' + '+roll;
              }
            }

            if(number > 10){
              result = total;
            }
            else{
              result = resultText+' = '+total;
            }
            await interaction.reply(`${interaction.user} has rolled ${number}d${dice}! \n Result: ${result}`);
          }
          
        }
        else{
          await interaction.reply("The bot is experiencing technical difficulties. Reach out to your nearest Cluckles and ask for a hug.");
        }
        
    }
  },
};