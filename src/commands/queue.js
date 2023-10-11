const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Message } = require('discord.js');
const { useQueue } = require('discord-player');
const { queueEmbedResponse } = require('../modules/music');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('queue')
      .setDescription('Shows the first 10 songs in the queue.'),
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
            
          // Check has queue
          const queue = useQueue(guild.id);
          if (!queue) {
            interaction.reply({ content: `${ member }, queue is currently empty. You should totally \`/play\` something - but that's just my opinion.` });
            return;
          }
          queueEmbedResponse(interaction, queue);
          // const queueArray = queue.tracks.toArray();
          // const queueString = queueArray.slice(0, 10).map((song, i) =>{
          //   return `${i + 1}) [${song.duration}]\` ${song.title} - <@${song.requestedBy.id}>`;
          // }).join("\n");
          // console.log(queueArray);
          // //const currentSong = queue.current;
  
          // await interaction.reply({
          //   embeds: [
          //     new EmbedBuilder()
          //         .setDescription(`**Queue:**\n${queueString}`)
          //   ]
          // });
      }
     
    },
  };