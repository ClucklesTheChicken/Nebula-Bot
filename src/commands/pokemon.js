const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const request = require('request');
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "../quotes.json" );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pokemon')
    .setDescription('Get information on a Pokemon!')
    .addStringOption(option =>
      option
        .setName('pokemon')
        .setDescription('The name of the Pokemon')
        .setRequired(true),
    ),
  async execute(interaction) {
    const pokemon = interaction.options.get('pokemon').value;
        request.get({
            url: 'https://pokeapi.co/api/v2/pokemon/'+pokemon
        }, function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else {
            //console.log(body);
            let pokemonJSON = null;
            let pokemonName = null;
            let pokemonNumber = null;
            let pokemonHeight = null;
            let pokemonWeight = null;
            let pokemonSpeciesJSON = null;
            let pokemonColour = null;
            let pokemonTypes = null;
            let pokemonDesc = null;
            let pokemonDescInit = null;
            let pokemonEggGroups = null;
            let pokemonLegendary = null;
            let pokemonMythical = null;
            let pokemonHabitat = null;
            pokemonJSON = JSON.parse(body);
            request.get({
                    url: pokemonJSON.species.url
                }, function(error2, response2, body2) {
                if(error2) return console.error('Request failed:', error2);
                else if(response2.statusCode != 200) return console.error('Error:', response2.statusCode, body2.toString('utf8'));
                else {
                    pokemonSpeciesJSON = JSON.parse(body2);
                    pokemonColour = pokemonSpeciesJSON.color.name;
                    let textLength = Object.keys(pokemonSpeciesJSON.flavor_text_entries).length;
                    if(textLength > 1){
                        let prevText = null;
                        let currentText = null;
                        for (let i = 0; i < textLength; i++) {
                            if(pokemonSpeciesJSON.flavor_text_entries[i].language.name == 'en'){
                                currentText = pokemonSpeciesJSON.flavor_text_entries[i].flavor_text;
                                currentText = currentText.replace(/(\r\n|\n|\r)/gm, " ");
                                currentText = currentText.replace(/\u000c/g," ");
                                if(i == 0){
                                    pokemonDescInit = currentText;
                                }
                                else{
                                    if(prevText == pokemonSpeciesJSON.flavor_text_entries[i].flavor_text){
                                        continue;
                                    }
                                    else{
                                        if(i > 5){
                                            continue;
                                        }
                                        else{
                                            if(pokemonDesc == null){
                                                pokemonDesc = currentText;
                                            }
                                            else{
                                                pokemonDesc += '\n'+currentText;
                                            }
                                        }
                                    }
                                }
                            }
                            else{
                                continue;
                            }
                            prevText = pokemonSpeciesJSON.flavor_text_entries[i].flavor_text;
                        } 
                    }
                    else{
                        pokemonDesc = pokemonSpeciesJSON.flavor_text_entries[0].flavor_text;
                    }
                    let typesLength = Object.keys(pokemonJSON.types).length;
                    if(typesLength > 1){
                        for (let i = 0; i < typesLength; i++) {
                            if(i == 0){
                                pokemonTypes = pokemonJSON.types[i].type.name;
                            }
                            else{
                                pokemonTypes += ', '+pokemonJSON.types[i].type.name;
                            }
                        } 
                    }
                    else{
                        pokemonTypes = pokemonJSON.types[0].type.name;
                    }
                    let eggLength = Object.keys(pokemonSpeciesJSON.egg_groups).length;
                    if(eggLength > 1){
                        for (let i = 0; i < eggLength; i++) {
                            if(i == 0){
                                pokemonEggGroups = pokemonSpeciesJSON.egg_groups[i].name;
                            }
                            else{
                                pokemonEggGroups += ', '+pokemonSpeciesJSON.egg_groups[i].name;
                            }
                        } 
                    }
                    else{
                        pokemonEggGroups = pokemonSpeciesJSON.egg_groups[0].name;
                    }
                    pokemonName = pokemonJSON.name;
                    pokemonName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);
                    pokemonNumber = '#'+pokemonJSON.id;
                    pokemonHeight = (pokemonJSON.height*10/100)+' m';
                    pokemonWeight = (pokemonJSON.weight/10)+' kg';
                    pokemonLegendary = pokemonSpeciesJSON.is_legendary ? 'Yes' : 'No';
                    pokemonMythical = pokemonSpeciesJSON.is_mythical ? 'Yes' : 'No';
                    pokemonHabitat = pokemonSpeciesJSON.habitat.name ? pokemonSpeciesJSON.habitat.name : 'Unknown';
                    pokemonImage = pokemonJSON.sprites.other['official-artwork'].front_default ? pokemonJSON.sprites.other['official-artwork'].front_default : pokemonJSON.sprites.front_default;
                    
                    const embed = new EmbedBuilder()
                    .setTitle(pokemonName)
                    .setDescription(pokemonDescInit)
                    .setColor('Random')
                    .setThumbnail(pokemonImage)
                    .addFields({ 
                        name: 'National Pokedex', 
                        value: pokemonNumber, 
                        inline: true 
                    },
                    { 
                        name: 'Types', 
                        value: pokemonTypes, 
                        inline: true 
                    },
                    { 
                        name: 'Weight', 
                        value: pokemonWeight, 
                        inline: true 
                    },
                    { 
                        name: 'Height', 
                        value: pokemonHeight, 
                        inline: true 
                    },
                    { 
                        name: 'Colour', 
                        value: pokemonColour, 
                        inline: true 
                    },
                    { 
                        name: 'Generation', 
                        value: pokemonSpeciesJSON.generation.name, 
                        inline: true 
                    },
                    { 
                        name: 'Legendary', 
                        value: pokemonLegendary, 
                        inline: true 
                    },
                    { 
                        name: 'Mythical', 
                        value: pokemonMythical, 
                        inline: true 
                    },
                    { 
                        name: 'Habitat', 
                        value: pokemonHabitat, 
                        inline: true 
                    },
                    { 
                        name: 'Egg Groups', 
                        value: pokemonEggGroups, 
                        inline: true 
                    },
                    { 
                        name: 'More info', 
                        value: pokemonDesc, 
                        inline: false 
                    }
                    );
                    interaction.reply({
                        embeds: [embed]
                    }); 
                }
            });

        }
        });
  },
};