require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const Discord = require('discord.js');
const fs = require("fs");
var path = require('path');
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Player } = require("discord-player");
const generateImage = require("./generateImage");

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

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

let commandCount = 0;

// Load slash commands
const commandsFolder = path.resolve(__dirname, "./commands");
const slashFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
for (const file of slashFiles) {
  const slashcmd = require(`./commands/${file}`)
  client.slashcommands.set(slashcmd.data.name, slashcmd)
  commandCount++;
}

// Deploy slash commands (only once)
const rest = new REST({ version: "9" }).setToken(process.env.TOKEN)
const commands = [...client.slashcommands.values()].map(command => command.data.toJSON());
console.log("Deploying slash commands...")
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
  .then(() => {
    console.log(`${commandCount} commands loaded`);
    goTime();
  })
  .catch((err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });

function goTime() {
  client.on("ready", (c) => {
    console.log(`${c.user.username} is online and ready for BITCHES.`);
  })

  client.on("interactionCreate", (interaction) => {
    async function handleCommand() {
      if (!interaction.isCommand()) return

      const slashcmd = client.slashcommands.get(interaction.commandName)
      if (!slashcmd) interaction.reply("Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.")

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

client.on('guildMemberAdd', async (member) => {
  const WelcomeChannelID = "1048208363244232725";
  const img = await generateImage(member);
  member.guild.channels.cache.get(WelcomeChannelID).send({
    content: `<@${member.id}>` + ' Welcome to the server!',
    files: [img]
  })
});

client.login(process.env.TOKEN);
