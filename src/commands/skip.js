const { SlashCommandBuilder } = require('@discordjs/builders');
const { usePlayer } = require('discord-player');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skips the current song'),
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
        const { member } = interaction;
        
        try {
          const guildPlayerNode = usePlayer(interaction.guild.id);
          // #requireVoiceSession doesn't check current track,
          // only session/player state
          const currentTrack = guildPlayerNode?.queue?.currentTrack;
          if (!currentTrack) {
            interaction.reply({ content: `${ member }, no music is currently being played - this command has been cancelled` });
            return;
          }
          const success = guildPlayerNode.skip();
          await interaction.reply(success
            ? `${ member }, skipped **\`${ currentTrack }\`**`
            : `${ member }, something went wrong - couldn't skip current playing song`);
        }
        catch (e) {
          interaction.reply(`${ member }, something went wrong:\n\n${ e.message }`);
        }
      }
     
    },
  };