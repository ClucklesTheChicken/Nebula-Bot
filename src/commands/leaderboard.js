// leaderboards.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const dbConfig = {
    host: process.env.HOST,
    user: process.env.MYSQLUSER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};

// Function to get the fastest catches leaderboard
async function getFastestCatchesLeaderboard(client) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT userid, fastest FROM achievements WHERE fastest IS NOT NULL ORDER BY fastest ASC LIMIT 15'
    );
    await connection.end();
    
    // Fetch the user's name using the Discord API
    const leaderboardRows = await Promise.all(rows.map(async row => {
      const roundedFastest = Math.ceil(row.fastest * 1000) / 1000; // Round up to 3 decimal points
      const user = await client.users.fetch(row.userid);
      return {
        name: user.username,
        fastest: roundedFastest.toFixed(3)
      };
    }));
  
    return leaderboardRows;
  }
  
  // Function to get the slowest catches leaderboard
  async function getSlowestCatchesLeaderboard(client) {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        'SELECT userid, slowest FROM achievements WHERE slowest IS NOT NULL ORDER BY slowest DESC LIMIT 15'
      );
      await connection.end();
      
      // Fetch the user's name using the Discord API
      const leaderboardRows = await Promise.all(rows.map(async row => {
        const roundesSlowest = Math.ceil(row.slowest * 1000) / 1000; // Round up to 3 decimal points
        const user = await client.users.fetch(row.userid);
        return {
          name: user.username,
          fastest: roundesSlowest.toFixed(3)
        };
      }));
  
      return leaderboardRows;
  }
  
  // Function to get the most Mayas leaderboard
  async function getMostTypesMayasLeaderboard(client) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT userid, JSON_LENGTH(inventory) AS maya_count FROM achievements ORDER BY maya_count DESC LIMIT 15'
    );
    await connection.end();
  
    // Fetch the user's name using the Discord API
    const leaderboardRows = await Promise.all(rows.map(async row => {
      const user = await client.users.fetch(row.userid);
      return {
        name: user.username,
        maya_count: row.maya_count
      };
    }));
  
    return leaderboardRows;
  }

  async function getMostMayasLeaderboard(client) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT userid, inventory FROM achievements'
    );
    await connection.end();

    // Calculate the total number of Mayas for each user
    const userMayaCounts = rows.map(row => {
      const inventory = row.inventory ? JSON.parse(row.inventory) : {};
      const totalMayas = Object.values(inventory).reduce((acc, count) => acc + count, 0);
      return {
        userid: row.userid,
        maya_count: totalMayas
      };
    });

    // Sort the users by their total Maya count in descending order and take the top 15
    const sortedUserMayaCounts = userMayaCounts.sort((a, b) => b.maya_count - a.maya_count).slice(0, 15);

    // Fetch the user's name using the Discord API
    const leaderboardRows = await Promise.all(sortedUserMayaCounts.map(async row => {
      const user = await client.users.fetch(row.userid);
      return {
        name: user.username,
        maya_count: row.maya_count
      };
    }));

    return leaderboardRows;
}



module.exports = {
    data: new SlashCommandBuilder()
      .setName('leaderboards')
      .setDescription('Displays the leaderboards.'),
    async execute(interaction) {
      await interaction.deferReply();
  
      const fastestRows = await getFastestCatchesLeaderboard(interaction.client);
  
      // Create the embed for the fastest times leaderboard
      const fastestEmbed = new EmbedBuilder()
        .setTitle('Leaderboards - Fastest Times')
        .setDescription('Top users with the fastest times:')
        .setColor('#FF5733');
        fastestRows.forEach((row, index) => {
            fastestEmbed.addFields({ name: `${index + 1}. ${row.name}`, value: `Time: ${row.fastest}`, inline: false });
        });
  
      // Create buttons
      const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('fastest_catches_leaderboard')
            .setLabel('Fastest Catches')
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId('slowest_catches_leaderboard')
            .setLabel('Slowest Catches')
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId('most_mayas_leaderboard')
            .setLabel('Most Mayas')
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId('most_types_mayas_leaderboard')
            .setLabel('Most Maya Types')
            .setStyle(ButtonStyle.Primary)
        );
  
      await interaction.editReply({ embeds: [fastestEmbed], components: [row] });
    },
    getFastestCatchesLeaderboard,
    getMostMayasLeaderboard,
    getSlowestCatchesLeaderboard,
    getMostTypesMayasLeaderboard
  };
