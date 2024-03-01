const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
var path = require('path');
const mayasData = require('./mayas.json'); 
const achievementsData = require('./achievements.json');
const mysql = require('mysql2/promise');
const mayaFolder = path.resolve( __dirname, "./mayas" );

// Database connection configuration
const dbConfig = {
    host: process.env.HOST,
    user: process.env.MYSQLUSER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};

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


    if (rows.length === 0) {
      // User does not exist, add a new user to the achievements table
      await addNewUser(userid);
    }
      
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

async function addNewUser(userid) {
    const connection = await mysql.createConnection(dbConfig);
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format the current date and time in MySQL DATETIME format
    await connection.execute('INSERT INTO achievements (userid, achievements, inventory, fastest, date_created) VALUES (?, NULL, NULL, NULL, ?)', [userid, currentDate]);
    await connection.end();
  }

module.exports = {
  createEmbed,
  updateInventory,
  handleAchievements,
  addNewUser
};
