// achievements.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed, handleAchievements } = require('../functions.js');
const achievementsData = require('../achievements.json'); // Adjust the path as needed
const mysql = require('mysql2/promise');
const dbConfig = {
    host: process.env.HOST,
    user: process.env.MYSQLUSER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('Displays your achievements.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    // Retrieve the user's achievements from the database
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT achievements FROM achievements WHERE userid = ?', [userId]);
    const userAchievements = rows.length > 0 && rows[0].achievements ? JSON.parse(rows[0].achievements) : {};
    await connection.end();

    // Calculate the total achievements possible
    const totalAchievements = Object.keys(achievementsData.count).length +
                              Object.keys(achievementsData.first).length +
                              Object.keys(achievementsData.misc).length -1;

    // Count the user's achievements
    const userAchievementsCount = Object.values(userAchievements).filter(value => value).length;

    // Create the embed
    const embed = createEmbed(
      'Achievements',
      `${userAchievementsCount}/${totalAchievements} achieved.\nYour achievements:`,
      '#FF5733'
    );
    for (const [achievementName, achieved] of Object.entries(userAchievements)) {
      if (achieved) {
        // Find the description of the achievement
        let description = '';
        if (achievementsData.count[achievementName]) {
          description = achievementsData.count[achievementName].description;
        } else if (achievementsData.first[achievementName]) {
          description = achievementsData.first[achievementName].description;
        } else if (achievementsData.misc[achievementName]) {
          description = achievementsData.misc[achievementName].description;
        }
    
        // Add the field to the embed
        embed.addFields({ name: achievementName, value: description, inline: true });
      }
    }
    const achievementEmbeds = await handleAchievements(userId, { type: 'maya', mayaName: 'nothingtoseehere' }, 'achievements');

    for (const achievementEmbed of achievementEmbeds) {
      await interaction.channel.send({ embeds: [achievementEmbed] });
    }

    await interaction.editReply({ embeds: [embed] })
    
  },
};
