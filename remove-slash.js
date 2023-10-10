const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: "9" }).setToken(TOKEN);

async function removeExistingSlashCommands() {
  try {
    console.log("Clearing existing slash commands...");

    // Fetch existing commands
    const existingCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));

    // Delete each existing command
    for (const command of existingCommands) {
      await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
      console.log(`Deleted command "${command.name}"`);
    }

    console.log("All existing slash commands have been removed.");
  } catch (error) {
    console.error("Error removing existing slash commands:", error);
  }
}

removeExistingSlashCommands();
