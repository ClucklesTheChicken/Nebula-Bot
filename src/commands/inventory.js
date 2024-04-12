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
    await interaction.deferReply(); // Defer the reply to give more time for processing

    const userId = interaction.user.id;
    // Retrieve the user's inventory from the database
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT inventory FROM achievements WHERE userid = ?', [userId]);
    const inventory = rows.length > 0 && rows[0].inventory ? JSON.parse(rows[0].inventory) : {};
    await connection.end();

    const embed = createEmbed('Inventory', 'Your inventory of Mayas:', '#FF5733');
    for (const [mayaName, count] of Object.entries(inventoryData)) {
      embed.addFields({ name: mayaName, value: count.toString().substring(0, 25), inline: true });
    }

    try{
      // Edit the deferred reply with the inventory embed
      await interaction.editReply({ embeds: [embed] });

      const achievementEmbeds = await handleAchievements(userId, { type: 'maya', mayaName: 'nothingtoseehere' }, 'inventory');
      for (const achievementEmbed of achievementEmbeds) {
        await interaction.followUp({ embeds: [achievementEmbed] });
      }
    } catch (error) {
      console.error('Error handling the command:', error);
      await interaction.followUp({ content: 'There was an error processing your request.', ephemeral: true });
    }
  },
};
