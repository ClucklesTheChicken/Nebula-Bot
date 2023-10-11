const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: "9" }).setToken(TOKEN);

async function removeExistingSlashCommands() {
  try {
    console.log("Clearing all existing slash commands...");

    // Fetch and delete global commands
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
    for (const command of globalCommands) {
      await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
      console.log(`Deleted global command "${command.name}"`);
    }

    // Fetch and delete guild-specific commands
    const guildCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
    for (const command of guildCommands) {
      await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
      console.log(`Deleted guild command "${command.name}"`);
    }

    console.log("All existing slash commands have been removed.");
  } catch (error) {
    console.error("Error removing existing slash commands:", error);
  }
}

removeExistingSlashCommands();
