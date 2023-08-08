require('dotenv').config();
const request = require('request');
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const { readFileSync } = require("fs");
const fs = require("fs");
var path = require('path');
const JSONpath = path.resolve( __dirname, "./quotes.json" );
const commandsFolder = path.resolve( __dirname, "./commands" );


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,        
    ]
});


client.commands = new Map();
let commandCount = 0;
const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commandCount++;
}

// Register the global slash commands
async function deployCommands() {
    try {
        // Register the new commands
        const commands = [...client.commands.values()].map(command => command.data.toJSON());
        await client.application.commands.set(commands);
    
        console.log(`${commandCount} commands loaded`);
      } catch (error) {
        console.error('Error deploying commands:', error);
      }
}

client.on('ready', (c) => {
    console.log(`${c.user.username} is online and ready for BITCHES.`);
    deployCommands(); // Register the commands when the bot is ready
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()){
      if(!interaction.isChatInputCommand()) return;
    
      const { commandName } = interaction;
    
      if (!client.commands.has(commandName)) return;
    
      try {
        await client.commands.get(commandName).execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.', ephemeral: true });
      }
    }
    else{
      return;
    }
});


client.login(process.env.TOKEN);


