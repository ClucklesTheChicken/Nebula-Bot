require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed, handleAchievements } = require('../functions.js');
const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
    host: process.env.HOST,
    user: process.env.MYSQLUSER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Displays your inventory of Mayas.'),
  async execute(interaction) {
    try {
      await interaction.deferReply(); // Defer the reply to give more time for processing

      const userId = interaction.user.id;
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute('SELECT inventory FROM achievements WHERE userid = ?', [userId]);
      const inventory = rows.length > 0 && rows[0].inventory ? JSON.parse(rows[0].inventory) : {};
      await connection.end();

      const fieldGroups = Object.entries(inventory).reduce((groups, item, index) => {
        const groupIndex = Math.floor(index / 24); // 25 fields per embed
        if (!groups[groupIndex]) groups[groupIndex] = [];
        groups[groupIndex].push({ name: item[0], value: item[1].toString(), inline: true });
        return groups;
      }, []);
      
      const embeds = fieldGroups.map((fields, index) => {
        return createEmbed(`Inventory Page ${index + 1}`, 'Your inventory of Mayas:', '#FF5733', null, fields);
      });
      
      // Send the first embed initially
      await interaction.editReply({ embeds: [embeds[0]] });
      
      // If there are more embeds, send them as follow-up messages
      for (let i = 1; i < embeds.length; i++) {
        await interaction.followUp({ embeds: [embeds[i]] });
      }

      const achievementEmbeds = await handleAchievements(userId, { type: 'maya', mayaName: 'nothingtoseehere' }, 'inventory'); // FORCE ACHIEVEMENT

      // Send achievement embeds as follow-up messages
      for (const achievementEmbed of achievementEmbeds) {
        await interaction.followUp({ embeds: [achievementEmbed] });
      }
    } catch (error) {
      console.error('An error occurred:', error);
      if (!interaction.replied) {
        await interaction.followUp({ content: 'There was an error processing your request.', ephemeral: true });
      }
    }
  },
};
