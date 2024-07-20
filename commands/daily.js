const { SlashCommandBuilder } = require('discord.js');
const { checkDailyProblem, getDailyProblem } = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Your Daily Nightmare! 💀💀💀'),
	async execute(interaction) {
		const isDailyProblemExist = await checkDailyProblem();
		if(!isDailyProblemExist){
			await getDailyProblem().then((res) => {
				const problemTitleSlug = res.question.titleSlug;
				console.log(problemTitleSlug)
				interaction.reply(problemTitleSlug);
			})
		}else{
			console.log(isDailyProblemExist);
			await interaction.reply(isDailyProblemExist);
		}
	},
};
