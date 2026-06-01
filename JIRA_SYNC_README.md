# Jira Integration Setup

This project is now integrated with Jira ticket tracking. The main ticket is [CPTR-68587](https://jira.disney.com/browse/CPTR-68587).

## Files Created

- **`jira-config.json`** - Main configuration file with ticket data
- **`jira-credentials.json`** - Your private credentials (not committed to git)
- **`jira-credentials.example.json`** - Template for credentials
- **`scripts/sync-jira.js`** - Script to fetch data from Jira
- **`jira-dashboard.html`** - Visual dashboard to view ticket status

## Quick Start

### 1. View the Dashboard

Open the dashboard in your browser:
```bash
open jira-dashboard.html
```

Or visit: https://chakn005.github.io/Content_flow_Integration/jira-dashboard.html

### 2. Sync with Jira

Run the sync script to fetch the latest data:
```bash
node scripts/sync-jira.js
```

This will:
- Fetch ticket details from CPTR-68587
- Get all related executions and linked issues
- Update `jira-config.json` with the latest data
- Refresh the dashboard automatically

### 3. Automate Syncing

You can set up automatic syncing using cron or GitHub Actions.

#### Option A: Cron Job (Local)
```bash
# Edit crontab
crontab -e

# Add this line to sync daily at 9 AM
0 9 * * * cd /Users/CHAKN005/AI\ training/content-integration-flow && node scripts/sync-jira.js
```

#### Option B: GitHub Actions (Automated)
Create `.github/workflows/sync-jira.yml`:
```yaml
name: Sync Jira Data

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Create credentials file
        run: |
          echo '{"jiraUsername":"${{ secrets.JIRA_USERNAME }}","jiraToken":"${{ secrets.JIRA_TOKEN }}"}' > jira-credentials.json
      
      - name: Sync Jira
        run: node scripts/sync-jira.js
      
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add jira-config.json
          git commit -m "Update Jira data" || echo "No changes"
          git push
```

**Note:** Add `JIRA_USERNAME` and `JIRA_TOKEN` to your GitHub repository secrets.

## Configuration

### Adding More Tickets

Edit `jira-config.json` and add tickets to the array:
```json
{
  "tickets": [
    {
      "key": "CPTR-68587",
      "url": "https://jira.disney.com/browse/CPTR-68587",
      ...
    },
    {
      "key": "CPTR-12345",
      "url": "https://jira.disney.com/browse/CPTR-12345",
      ...
    }
  ]
}
```

Then run the sync script to fetch their data.

### Customizing Status Mapping

Edit the `mapping` section in `jira-config.json`:
```json
{
  "mapping": {
    "jiraStatusToProjectStatus": {
      "Open": "pending",
      "In Progress": "in-progress",
      "Done": "completed"
    }
  }
}
```

## Troubleshooting

### Authentication Errors

If you get 401 errors:
1. Verify your credentials in `jira-credentials.json`
2. Check that your token hasn't expired
3. Ensure you have access to the Jira project

### Network Errors

If you're behind a corporate proxy:
```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.disney.com:8080
export HTTPS_PROXY=http://proxy.disney.com:8080
node scripts/sync-jira.js
```

### No Executions Found

The script looks for test executions linked to your ticket. If none are found:
- Check that test cases are properly linked in Jira
- Verify your Jira instance uses standard test execution fields
- You may need to customize the JQL query in `sync-jira.js`

## Security

- ✅ Credentials are stored locally and excluded from git
- ✅ Never commit `jira-credentials.json`
- ✅ Use GitHub Secrets for automated workflows
- ✅ Tokens can be revoked at any time from Jira

## Support

For issues or questions:
1. Check the Jira API documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v2/
2. Contact your Disney Jira administrator
3. Review the sync script logs for detailed error messages
