require('dotenv').config();
const request = require('request');
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const Discord = require('discord.js');
const { readFileSync } = require("fs");
const fs = require("fs");
var path = require('path');
const {REST} = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Player } = require("discord-player");
const JSONpath = path.resolve( __dirname, "./quotes.json" );
const commandsFolder = path.resolve( __dirname, "./commands" );
const generateImage = require("./generateImage");

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
//const LOAD_SLASH = process.argv[2] == "load";
const LOAD_SLASH = true;

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent, 
        IntentsBitField.Flags.GuildVoiceStates,       
    ]
});

client.slashcommands = new Discord.Collection(); 

client.player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25
  }
});
client.player.extractors.loadDefault();


let commands = [];
let commandCount = 0;
const slashFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
for (const file of slashFiles) {
  const slashcmd = require(`./commands/${file}`)
  client.slashcommands.set(slashcmd.data.name, slashcmd)
  commandCount++;
  if(LOAD_SLASH) commands.push(slashcmd.data.toJSON())
}

if(LOAD_SLASH){
  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN)
  console.log("Deploying slash commands...")
  rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands})
  .then(() => {
    console.log(`${commandCount} commands loaded`);
    //process.exit(0);
    goTime();
  })
  .catch((err) => {
    if(err){
      console.log(err);
      process.exit(1);
    }
  })
}

function goTime(){
  client.on("ready", (c) => {
    console.log(`${c.user.username} is online and ready for BITCHES.`);
  })
  client.on("interactionCreate", (interaction) => {
    async function handleCommand() {
      if(!interaction.isCommand()) return

      const slashcmd = client.slashcommands.get(interaction.commandName)
      if(!slashcmd) interaction.reply("Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.")

      //await interaction.deferReply()
      //await slashcmd.run({ interaction, client })
      try {
        await slashcmd.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.', ephemeral: true });
      }
    }
    handleCommand();
  })
}

// /////
// client.commands = new Map();
// let commandCount = 0;
// const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
// for (const file of commandFiles) {
//   const command = require(`./commands/${file}`);
//   client.commands.set(command.data.name, command);
//   commandCount++;
// }

// // Register the global slash commands
// async function deployCommands() {
//     try {
//         // Register the new commands
//         const commands = [...client.commands.values()].map(command => command.data.toJSON());
//         await client.application.commands.set(commands);
    
//         console.log(`${commandCount} commands loaded`);
//       } catch (error) {
//         console.error('Error deploying commands:', error);
//       }
// }
// ////


// client.on('ready', (c) => {
//     console.log(`${c.user.username} is online and ready for BITCHES.`);
//     deployCommands(); // Register the commands when the bot is ready
// });

// client.on('interactionCreate', async interaction => {
//     if (interaction.isCommand()){
//       if(!interaction.isChatInputCommand()) return;
    
//       const { commandName } = interaction;
    
//       if (!client.commands.has(commandName)) return;
    
//       try {
//         await client.commands.get(commandName).execute(interaction, client);
//       } catch (error) {
//         console.error(error);
//         await interaction.reply({ content: 'Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.', ephemeral: true });
//       }
//     }
//     else{
//       return;
//     }
// });

client.on('guildMemberAdd', async(member) => {
  // const channel = member.guild.channels.cache.find(channel => channel.name === 'welcome'); // Replace 'welcome' with the actual channel name

  // if (!channel) return;

  // channel.send(`Welcome to the server, ${member.user.username}!`);

  const WelcomeChannelID = "1048208363244232725";
        const img = await generateImage(member);
        member.guild.channels.cache.get(WelcomeChannelID).send({
            content: `<@${member.id}>`+' Welcome to the server!',
            files: [img]
  })
});


client.login(process.env.TOKEN);


