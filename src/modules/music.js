const {
    QueueRepeatMode, useQueue, usePlayer, GuildQueuePlayerNode, FFmpegFilterer, GuildQueueAudioFilters
  } = require('discord-player');
  const {
    EmbedBuilder, PermissionFlagsBits, ThreadAutoArchiveDuration
  } = require('discord.js');
    
  const queueTrackCb = (track, idx) => `${ ++idx }: (${ track.duration }) [**${ track.title }**](${ track.url })`;
  
  
  const queueEmbeds = (queue, guild, title) => {
    // Ok, display the queue!
    const currQueue = queue.tracks.toArray();
    const usableEmbeds = [];
    const chunkSize = 10;
    for (let i = 0; i < currQueue.length; i += chunkSize) {
      // Cut chunk
      const chunk = currQueue.slice(i, i + chunkSize);
      const embed = new EmbedBuilder()
        .setColor('Random')
        .setAuthor({
          name: `${ title } for ${ guild.name }`,
          iconURL: guild.iconURL({ dynamic: true })
        });
  
      // Resolve string output
      const chunkOutput = chunk.map((e, ind) => queueTrackCb(e, ind + i)).join('\n');
  
      // Construct our embed
      embed
        .setDescription(`
              **:musical_note: Now Playing:** ${ queue.currentTrack.title }
    
              ${ chunkOutput }
            `)
        .setImage(chunk[0]?.thumbnail)
        .setFooter({ text: `Page ${ Math.ceil((i + chunkSize) / chunkSize) } of ${
          Math.ceil(currQueue.length / chunkSize)
        // eslint-disable-next-line sonarjs/no-nested-template-literals
        } (${ i + 1 }-${ Math.min(i + chunkSize, currQueue.length) } / ${ currQueue.length })${ queue.estimatedDuration ? `` : '' }` });
  
      // Always push to usable embeds
      usableEmbeds.push(embed);
    }
  
    return usableEmbeds;
  };
  
  const queueEmbedResponse = (interaction, queue, title = 'Queue') => {
    const { guild, member } = interaction;
    // Ok, display the queue!
    const usableEmbeds = queueEmbeds(queue, guild, title);
    // Queue empty
    if (usableEmbeds.length === 0) interaction.reply({ embeds: [
      new EmbedBuilder()
        .setColor('Random')
        .setAuthor({
          name: `${ title } for ${ guild.name }`,
          iconURL: guild.iconURL({ dynamic: true })
        })
        .setDescription(`${ title } is currently empty`)
    ] });
    // Reply to the interaction with the SINGLE embed
    else if (usableEmbeds.length === 1) interaction.reply({ embeds: usableEmbeds }).catch(() => { /* Void */ });
    // Properly handle pagination for multiple embeds
    else handlePagination(interaction, member, usableEmbeds);
  };
  
  
  
  const nowPlayingEmbed = (queue, includeSessionDetails = true) => {
    const { currentTrack } = queue;
    const trackDescriptionOutputStr = currentTrack.description
      ? `\n\`\`\`\n${ currentTrack.description }\`\`\`\n`
      : '';
  
    const ts = queue.node.getTimestamp();
    const durationOut = ts === 'Forever' ? 'Live' : currentTrack.duration;
  
    const guildPlayerQueue = new GuildQueuePlayerNode(queue);
  
    const sessionDetails = includeSessionDetails
      ? `\n${ trackDescriptionOutputStr }\n${ guildPlayerQueue.createProgressBar() }`
      : '';
  
    const npEmbed = new EmbedBuilder({ color: 'Random' })
      .setTitle(currentTrack.title)
      .setURL(currentTrack.url)
      .setImage(currentTrack.thumbnail)
      .addFields(
        {
          name: 'Details',
          value: `
        👑 **Author:** ${ currentTrack.author }
        🚩 **Length:** ${ durationOut }
        📖 **Views:** ${ currentTrack.views.toLocaleString() }${ sessionDetails }
      `,
          inline: true
        }
      );
  
    if (includeSessionDetails) {
      npEmbed.addFields({
        name: 'Repeat/Loop Mode',
        value: repeatModeEmojiStr(queue.repeatMode),
        inline: false
      });
      npEmbed.setFooter({ text: `Requested by: ${ currentTrack.requestedBy.username }` });
      npEmbed.setTimestamp(queue.metadata.timestamp);
    }
  
    return npEmbed;
  };
  
  
  module.exports = {
    queueTrackCb,
    queueEmbeds,
    queueEmbedResponse,
    nowPlayingEmbed,
  };