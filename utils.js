const axios = require("axios");
const htmlparser2 = require("htmlparser2");
const nodeHtmlToImage = require("node-html-to-image");
const fs = require("node:fs/promises");
const path = require("path");

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

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("Error creating directory", err);
  }
}

async function writeQuestionToText(htmlBody, name) {
  try {
    const extractedText = await parseHtmlToText(htmlBody);

    const outputDir = path.join(__dirname, "output");
    await ensureDirectoryExists(outputDir);

    const outputPath = path.join(outputDir, "output.txt");
    await fs.writeFile(outputPath, extractedText);
    console.log("File written successfully to", outputPath);
  } catch (err) {
    console.error("Error writing to file", err);
  }
}

async function generateImage(htmlBody, name) {
  try {
    const outputDir = path.join(__dirname, "output");
    await ensureDirectoryExists(outputDir);

    await nodeHtmlToImage({
      output: path.join(outputDir, `${name}.png`),
      html: htmlBody,
    });
    console.log("The image was created successfully!");
  } catch (err) {
    console.error("Error generating image", err);
  }
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
  try {
    const res = await axios.post(
      LEETCODE_API_ENDPOINT,
      JSON.stringify({ query: DAILY_CODING_CHALLENGE_QUERY }),
      { headers: { "Content-Type": "application/json" } }
    );

    if (!res.data || !res.data.data || !res.data.data.activeDailyCodingChallengeQuestion) {
      console.error("Unexpected response structure:", res.data);
      return;
    }

    const dailyQuestion = res.data.data.activeDailyCodingChallengeQuestion;
    const htmlBodyString = dailyQuestion.question.content.toString();
    const name = dailyQuestion.question.titleSlug;
    await generateImage(htmlBodyString, name);
    await writeQuestionObject(dailyQuestion);
    return dailyQuestion;
  } catch (err) {
    console.error("Error fetching daily problem:", err);
  }
}

async function writeQuestionObject(dailyQuestion) {
  try {
    const questionObject = {
      url: "https://leetcode.com" + dailyQuestion.link,
      difficulty: dailyQuestion.question.difficulty,
      name: `${dailyQuestion.question.frontendQuestionId}. ${dailyQuestion.question.title}`,
      tags: dailyQuestion.question.topicTags.map(topic => topic.name).join(", "),
    };

    const questionString = JSON.stringify(questionObject, null, 2);

    const outputDir = path.join(__dirname, "output");
    await ensureDirectoryExists(outputDir);

    const outputPath = path.join(outputDir, "output.json");
    await fs.writeFile(outputPath, questionString);
    console.log("File written successfully to", outputPath);
  } catch (err) {
    console.error("Error writing to file", err);
  }
}

async function checkDailyProblem() {
  try {
    const foldersPath = path.join(__dirname, "output");
    const files = await fs.readdir(foldersPath);

    if (files.length === 0) {
      return null;
    }

    const outputFile = files.find(file => file.endsWith(".png"));
    if (!outputFile) {
      return null;
    }

    const questionName = outputFile.split(".")[0];

    const res = await axios.post(
      LEETCODE_API_ENDPOINT,
      JSON.stringify({ query: DAILY_CODING_CHALLENGE_QUERY }),
      { headers: { "Content-Type": "application/json" } }
    );

    const dailyQuestionName = res.data.data.activeDailyCodingChallengeQuestion.question.titleSlug;
    return questionName === dailyQuestionName ? dailyQuestionName : null;
  } catch (err) {
    console.error("Error checking daily problem:", err);
    return false;
  }
}

module.exports = {
  writeQuestionToText,
  generateImage,
  parseHtmlToText,
  getDailyProblem,
  checkDailyProblem,
};
