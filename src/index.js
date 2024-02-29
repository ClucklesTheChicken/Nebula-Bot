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
//const MAYA_CHANNEL_ID = '1208747548685107281'; // maya channel
const MAYA_CHANNEL_ID = '1202316000725307463'; // bots testing channel

const mayasData = require('./mayas.json'); 
const achievementsData = require('./achievements.json');
const mysql = require('mysql2/promise');
const mayaFolder = path.resolve( __dirname, "../mayas" );

// Database connection configuration
const dbConfig = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
let activeMaya = null;
let activeMayaMessage = null;
let activeMayaSpawnTime = null;

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
    spawnMayas();
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
  const interval = Math.random() * (40 - 30) + 30; // 30 -40 minute spawn
  setTimeout(async () => {
    const selectedMaya = getRandomMaya();
    // Post the selected Maya image and description to the channel
    // For example:
    activeMayaSpawnTime = Date.now(); // Record the spawn time
    const embed = createEmbed(
      `A ${selectedMaya.description} has appeared!`,
      `Get ready to catch her!`,
      '#FF5733'
    );
    // Create an attachment from the local image file
    let attachment = new AttachmentBuilder(`${mayaFolder}\\${selectedMaya.name}.png`, { name: 'maya.png' });
    embed.setImage('attachment://maya.png');

    if(activeMayaMessage){
      activeMayaMessage.delete().catch(console.error);
    }
    const message = await client.channels.cache.get(MAYA_CHANNEL_ID).send({ embeds: [embed], files: [attachment] });
    activeMayaMessage = message;

    // Store information about the spawned Maya in activeMaya
    activeMaya = selectedMaya;

    // Set a timeout to make Maya disappear after 3 minutes
    setTimeout(() => {
      if (activeMayaMessage) {
        activeMayaMessage.delete().catch(console.error);
        activeMayaMessage = null;
      }
      activeMaya = null;
    }, 3 * 60000);

    spawnMayas(); // Schedule the next Maya spawn
  //}, interval * 60000); // Convert minutes to milliseconds
  }, 20000);
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

      await connection.end();
    }
    message.delete().catch(console.error);
    
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

function createEmbed(title, description, color, thumbnail = null, fields = null) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  if (fields && Array.isArray(fields)) {
    fields.forEach(field => {
      if (field.name && field.value) {
        embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
      }
    });
  }

  return embed;
}

async function addNewUser(userid) {
  const connection = await mysql.createConnection(dbConfig);
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format the current date and time in MySQL DATETIME format
  await connection.execute('INSERT INTO achievements (userid, achievements, inventory, fastest, date_created) VALUES (?, NULL, NULL, NULL, ?)', [userid, currentDate]);
  await connection.end();
}

async function updateInventory(userid, mayaName, catchTime) {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT * FROM achievements WHERE userid = ?', [userid]);

  if (rows.length > 0) {
    let inventory = rows[0].inventory ? JSON.parse(rows[0].inventory) : {};
    inventory[mayaName] = (inventory[mayaName] || 0) + 1;

    // Update the fastest time if the current catch is faster
    let fastest = rows[0].fastest;
    if (fastest === null || catchTime < fastest) {
      fastest = catchTime;
    }

    await connection.execute('UPDATE achievements SET inventory = ?, fastest = ? WHERE userid = ?', [JSON.stringify(inventory), fastest, userid]);
  } else {
    // If the user does not exist, add a new user with the current catch time as the fastest
    await addNewUser(userid);
    await connection.execute('UPDATE achievements SET inventory = ?, fastest = ? WHERE userid = ?', [JSON.stringify({ [mayaName]: 1 }), catchTime, userid]);
  }

  await connection.end();
}

async function handleAchievements(userid, eventData, forceAchieve = false) {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT * FROM achievements WHERE userid = ?', [userid]);
      
  let achievements = rows.length > 0 && rows[0].achievements ? JSON.parse(rows[0].achievements) : {};
  let inventory = rows.length > 0 && rows[0].inventory ? JSON.parse(rows[0].inventory) : {};

  const embeds = [];
  let updated = false;
  if(forceAchieve == false){
    // Check count achievements
    for (const [name, data] of Object.entries(achievementsData.count)) {
      const totalMayasCaught = Object.values(inventory).reduce((acc, val) => acc + val, 0) +1;
      if (totalMayasCaught >= data.requirement && !(name in achievements)) {
        achievements[name] = true;
        updated = true;
        embeds.push(createEmbed(`${name} Achievement Unlocked!`, `<@${userid}> ${data.description}`, '#FF5733'));
      }
    }

    // Check first achievements
    for (const [name, data] of Object.entries(achievementsData.first)) {
      if (!(name in achievements)) {
        if (data.hasOwnProperty('requirement')) {
          if (eventData.type === 'maya' && eventData.mayaName.includes(data.requirement)) {
            achievements[name] = true;
            updated = true;
            embeds.push(createEmbed(`${name} Achievement Unlocked!`, `<@${userid}> ${data.description}`, '#FF5733'));
          }
        }
      }
    }

    // Check catchall
    if (!('catchall' in achievements)) {
      if (Object.keys(mayasData).every(maya => maya in inventory)) {
        achievements['catchall'] = true;
        updated = true;
        embeds.push(createEmbed(`catchall Achievement Unlocked!`, `<@${userid}> ${achievementsData.misc.catchall.description}`, '#FF5733'));
      }
    }
  }
  else{
    let achievementSection = null;
    let achievementData = null;

    // Determine which section the achievement belongs to
    if (forceAchieve in achievementsData.count) {
      achievementSection = 'count';
    } else if (forceAchieve in achievementsData.first) {
      achievementSection = 'first';
    } else if (forceAchieve in achievementsData.misc) {
      achievementSection = 'misc';
    }

    // Get the achievement data
    if (achievementSection) {
      achievementData = achievementsData[achievementSection][forceAchieve];
    }

    if(forceAchieve == 'mayadonator'){
      if(eventData.mayaName.includes('ultimate') && achievements['R I C H'] !== true){
        if('R I C H' in achievements){
          if(achievements['R I C H'] >= 4){
            achievements['R I C H'] = true;
            updated = true;
            embeds.push(createEmbed(`R I C H Achievement Unlocked!`, `<@${userid}> Donated 5 ultimate Mayas to the bot! THENKS`, '#FF5733'));
          }
          else{
            achievements['R I C H'] = achievements['R I C H'] + 1;
          }
        }
        else{
          achievements['R I C H'] = 1;
          updated = true;
        }
      }
    }

    // Add the achievement if it doesn't exist
    if (achievementData && !(forceAchieve in achievements)) {
      achievements[forceAchieve] = true;
      updated = true;
      embeds.push(createEmbed(`${forceAchieve} Achievement Unlocked!`, `<@${userid}> ${achievementData.description}`, '#FF5733'));
    }
  }
  

  if (updated) {
    await connection.execute('UPDATE achievements SET achievements = ? WHERE userid = ?', [JSON.stringify(achievements), userid]);
  }
  
  await connection.end();
  return embeds;
}


client.login(process.env.TOKEN);
