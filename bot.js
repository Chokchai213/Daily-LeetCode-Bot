const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
} = require("discord.js");
const CronJob = require("cron").CronJob;
const axios = require("axios");
const htmlparser2 = require("htmlparser2");
const nodeHtmlToImage = require("node-html-to-image");
const fs = require("node:fs/promises");
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

const LEETCODE_API_ENDPOINT = "https://leetcode.com/graphql";
const DAILY_CODING_CHALLENGE_QUERY = `
query questionOfToday {
	activeDailyCodingChallengeQuestion {
		date
		userStatus
		link
		question {
			acRate
			difficulty
			freqBar
			frontendQuestionId: questionFrontendId
			isFavor
			paidOnly: isPaidOnly
			status
			title
			titleSlug
			hasVideoSolution
			hasSolution
      sampleTestCase
      content
			topicTags {
				name
				id
				slug
			}
		}
	}
}`;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

async function writeQuestionToText(htmlBody, name) {
  try {
    const extractedText = await parseHtmlToText(htmlBody);

    const outputDir = path.join(__dirname, 'output');
    const outputPath = path.join(outputDir, 'output.txt');
      // Write the extracted text to the output file
      fs.writeFile(outputPath, extractedText, (err) => {
          if (err) {
              console.error('Error writing to file', err);
          } else {
              console.log('File written successfully to', outputPath);
          }
      });
  } catch (err) {
    console.log(err);
  }
}

async function generateImage(htmlBody, name) {
  nodeHtmlToImage({
    output: `./output/${name}.png`,
    html: htmlBody,
  }).then(() => console.log("The image was created successfully!"));
}

async function parseHtmlToText(htmlBody) {
  let extractedText = "";

  const parser = new htmlparser2.Parser({
    ontext(text) {
      extractedText += text;
    },
  });

  parser.write(htmlBody);
  parser.end();
  return extractedText;
}

async function getDailyProblem() {
  const res = await axios.post(
    LEETCODE_API_ENDPOINT,
    JSON.stringify({ query: DAILY_CODING_CHALLENGE_QUERY }),
    { headers: { "Content-Type": "application/json" } }
  );
  const url =
    "https://leetcode.com" +
    res.data.data.activeDailyCodingChallengeQuestion.link;
  const htmlBodyString =
    res.data.data.activeDailyCodingChallengeQuestion.question.content.toString();
  const name = res.data.data.activeDailyCodingChallengeQuestion.question.titleSlug
    await writeQuestionToText(htmlBodyString, name);
    await generateImage(htmlBodyString, name);

    return 0;
}

async function sendMessageToChannel(msg) {
  try {
    client.guilds.cache.forEach((guild) => {
      guild.channels.cache.forEach(async (channel) => {
        console.log(channel);
        if (channel.type == 0) {
          const channelSend = await client.channels.fetch(channel.id);
          if (!channelSend) {
            console.log("Channel Not Found :: ", channelSend);
          }
          const permissions = channelSend.permissionsFor(client.user);
          if (
            !permissions ||
            !permissions.has(PermissionsBitField.Flags.SendMessages)
          ) {
            console.log(
              `No permission to send messages in channel: ${channel.id}`
            );
            return;
          }

          channelSend.send(msg).catch((error) => {
            console.error(
              `Failed to send message to channel ${channel.id}:`,
              error
            );
          });
        }
      });
    });
  } catch (error) {
    console.error("Error sending message to channel:", error);
  }
}

const job = new CronJob(
  "10 49 17 * * 1-7",
  async function () {
    const msg = await getDailyProblem();
    sendMessageToChannel(msg);
  },
  null,
  true,
  "Asia/Bangkok"
);

client.on("messageCreate", async (msg) => {
  const desc = await getDailyProblem();
  // sendMessageToChannel(desc);
});

client.login(process.env.TOKEN);
