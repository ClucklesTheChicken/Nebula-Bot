require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const Discord = require('discord.js');
const { AttachmentBuilder } = require('discord.js');
const fs = require("fs");
var path = require('path');
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Player } = require("discord-player");
const { EmbedBuilder } = require('discord.js');
const generateImage = require("./generateImage");
const { createEmbed, updateInventory, handleAchievements, addNewUser } = require('./functions.js');

const MAYA_CHANNEL_ID = '1208747548685107281'; // maya channel
//const MAYA_CHANNEL_ID = '1202316000725307463'; // bots testing channel

const mayasData = require('./mayas.json');
const leaderboard = require('./commands/leaderboard.js');
const achievementsData = require('./achievements.json');
const mysql = require('mysql2/promise');
const mayaFolder = path.resolve( __dirname, "../mayas" );

// Database connection configuration
const dbConfig = {
    host: process.env.HOST,
    user: process.env.MYSQLUSER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
let activeMaya = null;
let activeMayaMessage = null;
let activeMayaSpawnTime = null;
let activeFakeMayaMessage = null;

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
  client.on("ready", async (c) => {
    
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM achievements');
    if (rows.length !== 0) {
      console.log('Connection to DB successful!');
    }
    else{
      console.log('Connection to DB failed...');
    }
    await connection.end();
    console.log(`${c.user.username} is online and ready for BITCHES.`);
    spawnMayas();
  })

  client.on("interactionCreate", (interaction) => {
    async function handleCommand() {
      if (interaction.isButton()) {
        if (interaction.customId === 'fastest_catches_leaderboard') {
          const fastestRows = await leaderboard.getFastestCatchesLeaderboard(interaction.client);
          const fastestEmbed = new EmbedBuilder()
            .setTitle('Leaderboards - Fastest Times')
            .setDescription('Top users with the fastest times:')
            .setColor('#FF5733');
          fastestRows.forEach((row, index) => {
            fastestEmbed.addFields({ name: `${index + 1}. ${row.name}`, value: `Time: ${row.fastest}`, inline: false });
          });
          await interaction.update({ embeds: [fastestEmbed] });
        }
        else if (interaction.customId === 'slowest_catches_leaderboard') {
            const slowestRows = await leaderboard.getSlowestCatchesLeaderboard(interaction.client); // Corrected function name
            const slowestEmbed = new EmbedBuilder()
                .setTitle('Leaderboards - Slowest Catches') // Changed to "Catches"
                .setDescription('Top users with the slowest catches:') // Changed to "catches"
                .setColor('#FF5733');
            slowestRows.forEach((row, index) => {
                slowestEmbed.addFields({ name: `${index + 1}. ${row.name}`, value: `Time: ${row.fastest}`, inline: false });
            });
            await interaction.update({ embeds: [slowestEmbed] });
        }
         else if (interaction.customId === 'most_mayas_leaderboard') {
          const mostMayasRows = await leaderboard.getMostMayasLeaderboard(interaction.client);
          const mostMayasEmbed = new EmbedBuilder()
            .setTitle('Leaderboards - Most Mayas')
            .setDescription('Top users with the most Mayas:')
            .setColor('#FF5733');
          mostMayasRows.forEach((row, index) => {
            mostMayasEmbed.addFields({ name: `${index + 1}. User ${row.name}`, value: `Mayas: ${row.maya_count}`, inline: false });
          });
          await interaction.update({ embeds: [mostMayasEmbed] });
        }
      }
      else if (interaction.isCommand()){
        const slashcmd = client.slashcommands.get(interaction.commandName)
        if (!slashcmd) interaction.reply("Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.")
  
        try {
          await slashcmd.execute(interaction, client);
        } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'Sorry, there were some technical difficulties. Please ask your nearest Cluckles for a hug.', ephemeral: true });
        }
      }
      else{
        return;
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

function getRandomMaya() {
  const totalWeight = Object.values(mayasData).reduce((acc, maya) => acc + maya.catchChance, 0);
  let random = Math.random() * totalWeight;
  for (const [name, maya] of Object.entries(mayasData)) {
    random -= maya.catchChance;
    if (random <= 0) {
      return { name, ...maya };
    }
  }
}

function spawnMayas() {
  const interval = Math.random() * (40 - 25) + 25; // 25 -40 minute spawn
  setTimeout(async () => {
    const selectedMaya = getRandomMaya();
    const embed = createEmbed(
      `A ${selectedMaya.description} has appeared!`,
      `Get ready to catch her!`,
      '#FF5733'
    );
    // Create an attachment from the local image file
    let attachment = new AttachmentBuilder(`${mayaFolder}/${selectedMaya.name}.png`, { name: 'maya.png' });
    embed.setImage('attachment://maya.png');

    if(activeMayaMessage){
      activeMayaMessage.delete().catch(console.error);
    }
    const message = await client.channels.cache.get(MAYA_CHANNEL_ID).send({ embeds: [embed], files: [attachment] });
    activeMayaSpawnTime = Date.now(); // Record the spawn time

    activeMayaMessage = message;

    // Store information about the spawned Maya in activeMaya
    activeMaya = selectedMaya;

    // Chance to spawn a fake Maya with a different interval
    if (Math.random() < 0.15) {
    //if (true) {
      const fakeInterval = Math.random() * (35 - 24) + 24; // 20 - 35 minute spawn for the fake Maya
      setTimeout(async () => {
        const fakeEmbed = createEmbed(
          `A Fake Maya has appeared!`,
          `Get ready to catch her!`,
          '#FF5733'
        );
        const fakeAttachment = new AttachmentBuilder(`${mayaFolder}/fake.gif`, { name: 'fake.gif' });
        fakeEmbed.setImage('attachment://fake.gif');

        const fakeMessage = await client.channels.cache.get(MAYA_CHANNEL_ID).send({ embeds: [fakeEmbed], files: [fakeAttachment] });
        activeFakeMayaMessage = fakeMessage;

        // Set a timeout to make the fake Maya disappear after 3 minutes
        setTimeout(() => {
          if (activeFakeMayaMessage) {
            activeFakeMayaMessage.delete().catch(console.error);
            activeFakeMayaMessage = null;
          }
        }, 1 * 60000);
      }, fakeInterval * 60000); // Convert minutes to milliseconds for the fake Maya
      //}, 8000);
    }

    // Set a timeout to make Maya disappear after 3 minutes
    setTimeout(() => {
      if (activeMayaMessage) {
        activeMayaMessage.delete().catch(console.error);
        activeMayaMessage = null;
      }
      activeMaya = null;
    }, 3 * 60000);

    spawnMayas(); // Schedule the next Maya spawn
  }, interval * 60000); // Convert minutes to milliseconds
  //}, 20000);
}

client.on('messageCreate', async (message) => {
  if (message.channel.id === MAYA_CHANNEL_ID && message.content.toLowerCase() === 'maya') {
    if (activeMaya) {
       // Remove the active Maya
      let catchTime = (Date.now() - activeMayaSpawnTime) / 1000; // Calculate the catch time in seconds
      let activeMayaDescription = activeMaya.description;
      let activeMayaName = activeMaya.name;
      let dateNow = new Date();
      dateNow.toISOString().split('T')[0];
      activeMaya = null;

      let embed;

      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute('SELECT * FROM achievements WHERE userid = ?', [message.author.id]);

      if (rows.length === 0) {
        // User does not exist, add a new user to the achievements table
        await addNewUser(message.author.id);
      }

      await updateInventory(message.author.id, activeMayaName, catchTime);

      
      // Handle achievements
      const achievementEmbeds = await handleAchievements(message.author.id, { type: 'maya', mayaName: activeMayaName });
      //handleAchievements(message.author.id, { type: 'maya', mayaName: 'ultimate' }, 'mayadonator'); // FORCE ACHIEVEMENT
      // Send the embed in a message
      embed = createEmbed(
        'Maya Caught!',
        `<@${message.author.id}> caught a ${activeMayaDescription} in ${catchTime} seconds!`,
        '#FF5733'
      );

      // Create an attachment from the local image file
      const attachment = new AttachmentBuilder(`${mayaFolder}/${activeMayaName}.png`, { name: 'maya.png' });

      // Set the image in the embed to the attachment
      embed.setImage('attachment://maya.png');

      message.channel.send({ embeds: [embed], files: [attachment] });

      // Send the achievement embeds to the chat
      for (const embed of achievementEmbeds) {
        message.channel.send({ embeds: [embed] });
      }

      if (activeMayaMessage) {
        activeMayaMessage.delete().catch(console.error);
        activeMayaMessage = null;
      }
      message.delete().catch(console.error);
      await connection.end();
    }
    else if (activeFakeMayaMessage) {
      // User tried to catch the fake Maya
      activeFakeMayaMessage.delete().catch(console.error);
      activeFakeMayaMessage = null;
      message.react('<:cluckleslaugh:1161291084043919483>'); // Use the full emoji format
      message.channel.send(`<@${message.author.id}> GOT JUKED by a fake Maya! Let's all point and laugh`);
      const achievementEmbeds = await handleAchievements(message.author.id, { type: 'maya', mayaName: 'nothingtoseehere' }, 'getjuked');

      for (const embed of achievementEmbeds) {
        message.channel.send({ embeds: [embed] });
      }

    }
    else{
      message.delete().catch(console.error);
    }
    
    
  }
  else if(message.channel.id === MAYA_CHANNEL_ID && message.content.toLowerCase() === 'cat'){
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM achievements WHERE userid = ?', [message.author.id]);
    if (rows.length === 0) {
      await addNewUser(message.author.id);
    }   
    const achievementEmbeds = await handleAchievements(message.author.id, { type: 'maya', mayaName: 'NADA' }, 'notquite');
    
    for (const embed of achievementEmbeds) {
      message.channel.send({ embeds: [embed] });
    }
    await connection.end();
    message.delete().catch(console.error);
  }
});


client.login(process.env.TOKEN);
