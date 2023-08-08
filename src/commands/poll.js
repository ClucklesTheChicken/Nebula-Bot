const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option
        .setName('polltitle')
        .setDescription('Title for the poll')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('The question for the poll')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('options')
        .setDescription('Comma-separated list of poll options (max 10)')
        .setRequired(true)
    ),
  async execute(interaction) {
    if(!interaction.member.roles.cache.has("1119275407515062334")){
      interaction.reply(`Sorry you don't have permission to do that.`);
    }
    else{
      await interaction.deferReply({ephemeral: true});
      const title = interaction.options.getString('polltitle');
      const question = interaction.options.getString('question');
      const options = interaction.options.getString('options').split(',');
  
      const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']
  
      // Create the embed for the poll
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(question);
      if(options.length > 10){
        await interaction.reply('Please use no more than 10 options.')
      }
      else{
        for (let i = 0; i < options.length; i++) {
          let emoji = emojis[i];
          embed.addFields(
          { 
            name: `${emoji} ${options[i].trim()}`, 
            value: ' ', 
            inline: false 
          });
        }
        
        const message = await interaction.channel.send({embeds: [embed]});
  
  
        for (let i = 0; i < options.length; i++) {
          let emoji = emojis[i];
          message.react(emoji);
        }
  
        await interaction.editReply('sent poll successfully!');
      }
    }
    
    

  },
};