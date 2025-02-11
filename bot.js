const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
} = require("discord.js");
const CronJob = require("cron").CronJob;
const path = require('node:path');
const fs = require('node:fs');
const { getDailyProblem, checkDailyProblem } = require("./utils");


const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');

	const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(foldersPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const job = new CronJob(
  "10 01 11 * * 1-7",
  async function () {
    const msg = await getDailyProblem();
  },
  null,
  true,
  "Asia/Bangkok"
);

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(process.env.TOKEN);

