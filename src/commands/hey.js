const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hey')
    .setDescription('Replies to you, I guess'),
  async execute(interaction) {
    await interaction.reply('Awe Poes');
  },
};