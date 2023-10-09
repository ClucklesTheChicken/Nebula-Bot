const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { QueryType } = require('discord-player');
const {
  useMainPlayer, useQueue, EqualizerConfigurationPreset
} = require('discord-player')
const player = useMainPlayer();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song')
    .addSubcommand((subcommand) => {
      return subcommand
        .setName('search')
        .setDescription('Searches for a song.')
        .addStringOption((option) => {
          return option.setName('searchterms').setDescription('Search keywords').setRequired(true);
        });
    })
    .addSubcommand((subcommand) => {
      return subcommand
        .setName('playlist')
        .setDescription('Plays a playlist from YouTube')
        .addStringOption((option) => {
          return option.setName('url').setDescription('Playlist URL').setRequired(true);
        });
    })
    .addSubcommand((subcommand) => {
      return subcommand
        .setName('song')
        .setDescription('Plays a song from YouTube')
        .addStringOption((option) => {
          return option.setName('url').setDescription('URL of the song').setRequired(true);
        });
    }),
  execute: async (interaction, client) => {
    //////
    if(!interaction.member.roles.cache.has("1119275407515062334")){
      await interaction.reply(`Sorry you don't have permission to do that.`);
      return;
    }
    if(!interaction.member.voice.channel){
        await interaction.reply(`You must be in a voice channel to use this command`);
        return;
    }
    const { member, guild } = interaction;
    //const query = interaction.options.getString('query', true); // we need input/query to play
    const query = interaction.options.getString('searchterms') || interaction.options.getString('url');

    // Ok, safe to access voice channel and initialize
    const channel = member.voice?.channel;

    // Let's defer the interaction as things can take time to process
    await interaction.deferReply();

    
    try {
        // Check is valid
        let searchResult = null;
        if (interaction.options.getSubcommand() === 'song') {
            searchResult = await client.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_VIDEO, //  QueryType.YOUTUBE_PLAYLIST,   QueryType.AUTO,
          });
        }
        else if(interaction.options.getSubcommand() === 'playlist'){
            searchResult = await client.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_PLAYLIST, //  QueryType.YOUTUBE_PLAYLIST,   QueryType.AUTO,
          });
        }
        else if(interaction.options.getSubcommand() === 'search'){
            searchResult = await client.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.QueryType, //  QueryType.YOUTUBE_PLAYLIST,   QueryType.AUTO,
          });
        }
        if (!searchResult.hasTracks()) {
          interaction.editReply(`${ member }, no tracks found for query \`${ query }\` - this command has been cancelled`);
          return;
        }
        // nodeOptions are the options for guild node (aka your queue in simple word)
        // we can access this metadata object using queue.metadata later on
        const { track } = await player.play(
          channel,
          searchResult,
          {
            requestedBy: interaction.user,
            nodeOptions: {
              metadata: {
                channel: channel,
                member,
                timestamp: interaction.createdTimestamp
              }
            }
          }
        );

        // Use queue
        const queue = useQueue(guild.id);
        queue.filters.equalizer.disable();
        // Feedback
        await interaction.editReply(`${ member }, enqueued **\`${ track.title }\`**!`);
      
      
    }
    catch (e) {
      interaction.editReply(` ${ member }, something went wrong:\n\n${ e.message }`);
    }
  },
};
