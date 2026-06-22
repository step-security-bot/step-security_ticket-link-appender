[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# Ticket Link Appender

This action automatically updates your pull request by heuristically searching ticket link from your Jira or other project tracking software and appends on your pull request.

> This tool can be used with other project tracking tools like ClickUp as well. Let's explore together!

## Settings

`jira-project-url`

**Required** Add your jira link in ticket link format.
E.g:
`https://jira.atlassian.net/browse`

`ticket-regex-title`

**Optional** You can add custom regex if your PR description seems to be different but I encourage to have same standard world wide.

#### PR summary example:

`XYZ-1234: This is an amazing feature`

## Outputs

Appends ticket link in your PR description:

Jira Link: https://jira.atlassian.net/browse/JPT-1571

## Example usage

`GITHUB_TOKEN` will automatically be there.

```yaml
uses: step-security/ticket-link-appender@v1
  with:
    jira-project-url: https://jira.atlassian.net/browse
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Full example

```yaml
on: pull_request

jobs:
  example_pr_link:
    runs-on: ubuntu-latest
    name: Auto ticket link appender
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Append ticket link
        uses: step-security/ticket-link-appender@v1

        with:
          jira-project-url: https://jira.atlassian.net/browse
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

