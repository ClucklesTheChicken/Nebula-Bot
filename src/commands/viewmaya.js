// viewmaya.js
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
var path = require('path');
const dbConfig = {
    host: process.env.HOST,
    user: process.env.MYSQLUSER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: 3306
};
const mayaFolder = path.resolve(__dirname, "../../mayas");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewmaya')
        .setDescription('View a specific Maya that you have caught.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the Maya you want to view.')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const mayaName = interaction.options.getString('name');

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT inventory FROM achievements WHERE userid = ?', [userId]);
        const inventory = rows.length > 0 && rows[0].inventory ? JSON.parse(rows[0].inventory) : {};
        await connection.end();

        if (inventory[mayaName]) {
            // User has the Maya
            const embed = new EmbedBuilder()
                .setTitle(`${mayaName.charAt(0).toUpperCase() + mayaName.slice(1)} Maya`)
                .setColor('#FF5733');

            const attachment = new AttachmentBuilder(`${mayaFolder}/${mayaName}.png`, { name: 'maya.png' });
            embed.setImage('attachment://maya.png');

            await interaction.reply({ embeds: [embed], files: [attachment], ephemeral: true });
        } else {
            // User does not have the Maya
            await interaction.reply({ content: `You do not have a ${mayaName} Maya.`, ephemeral: true });
        }
    }
};
