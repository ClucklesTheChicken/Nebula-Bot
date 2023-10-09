const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Message } = require('discord.js');
const { useQueue } = require('discord-player');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('disconnect')
      .setDescription('Disconnects the bot and destroys the queue.'),
    execute: async (interaction, client) => {
      if(!interaction.member.roles.cache.has("1119275407515062334")){
        await interaction.reply(`Sorry you don't have permission to do that.`);
        return;
      }
      if(!interaction.member.voice.channel){
          await interaction.reply(`You must be in a voice channel to use this command`);
          return;
      }
      else{
        const { guild, member } = interaction;
    
        try {
          const queue = useQueue(guild.id);
          queue.delete();
          await interaction.reply(`${ member }, your poes too`);
        }
        catch (e) {
          interaction.reply(`${ member }, something went wrong:\n\n${ e.message }`);
        }
      }
     
    },
  };