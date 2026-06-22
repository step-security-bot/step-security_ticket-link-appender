/* eslint-disable camelcase */
const core = require("@actions/core");
const github = require("@actions/github");
const fs = require('fs');
const axios = require('axios');

const jirProjectUrl = core.getInput("jira-project-url");
const ticketRegexRaw = core.getInput("ticket-regex-title");
const githubToken = core.getInput("GITHUB_TOKEN");

const octokit = new github.getOctokit(githubToken);

const DEFAULT_TICKET_REGEX = /^[A-Z,a-z]{2,}-\d{1,}:/g;

/**
 * Searches with first Ticket like structure with colon and later removes it.
 *
 * @param {string} title
 */
function grabTicket(title) {
  const ticketRegex = ticketRegexRaw
    ? new RegExp(ticketRegexRaw, "g")
    : DEFAULT_TICKET_REGEX;
  const ticketIdWithColon = title.match(ticketRegex)?.[0];

  if (!ticketIdWithColon) {
    return null;
  }

  return ticketIdWithColon.slice(0, -1);
}

/**
 * Fetches old PR description and appends Ticket link.
 *
 * @param {*} context
 * @returns {string} Updated body string.
 */
function appendLinkInDescription(context) {
  const prevBody = context.payload.pull_request.body || "";
  const ticketNumber = grabTicket(context.payload.pull_request.title);

  if (!ticketNumber || prevBody.includes("Jira link:")) {
    return;
  }

  const updatedBody = `${prevBody} \n\n ----- \nJira link: [${ticketNumber}](${
    jirProjectUrl + "/" + ticketNumber
  })`;

  return updatedBody;
}

async function validateSubscription() {
  let repoPrivate;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    const payload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    repoPrivate = payload?.repository?.private;
  }

  const upstream = 'sbimochan/ticket-link-appender';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';
  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) core.info('\u001b[32m✓ Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');
  if (repoPrivate === false) return;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body = { action: action || '' };
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body, { timeout: 3000 }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      core.error(`\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`);
      core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}

/**
 * Main entry function.
 *
 * @returns Void.
 */
async function runMain() {
  await validateSubscription();
  try {
    const context = github.context;

    if (context.payload.pull_request === null) {
      core.setFailed("No pull request found.");

      return;
    }

    const pullRequestNumber = context.payload.pull_request.number;

    const updatedBody = await appendLinkInDescription(context);

    if (!updatedBody) {
      return;
    }
    await octokit.rest.pulls.update({
      ...context.repo,
      pull_number: pullRequestNumber,
      body: updatedBody,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

runMain();
