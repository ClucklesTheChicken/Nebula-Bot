const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Message } = require('discord.js');
const { usePlayer } = require('discord-player');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('pause')
      .setDescription('Pause/resume the playback, this is a toggle'),
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
        const { member, guild } = interaction;
    
    
        try {
          const guildPlayerNode = usePlayer(guild.id);
          const newPauseState = !guildPlayerNode.isPaused();
          guildPlayerNode.setPaused(newPauseState);
          await interaction.reply(`${ member }, ${ newPauseState ? 'paused' : 'resumed' } playback`);
        }
        catch (e) {
          interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
        }
      }
     
    },
  };