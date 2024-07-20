const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const clientId = process.env.CLIENTID;
const guildId = process.env.GUILDID;
const token = process.env.TOKEN;

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
  .readdirSync(foldersPath)
  .filter((file) => file.endsWith(".js"));
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const filePath = path.join(foldersPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
  try {
    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationCommands(clientId, guildId), {
      body: commands,
    });
    console.log(data);

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
