# Jira Auto-Sync Setup Guide

This guide will help you set up automatic Jira synchronization for your site using GitHub Actions.

## Overview

Once configured, your site will:
- ✅ Automatically sync with CPTR-68587 daily
- ✅ Update the heatmap based on test execution status
- ✅ Pull all linked tickets and executions
- ✅ Commit changes automatically to GitHub
- ✅ Deploy updates to GitHub Pages

## Prerequisites

1. GitHub repository with Actions enabled (already done ✅)
2. Jira credentials (username and API token)
3. 5 minutes to configure

## Step-by-Step Setup

### Step 1: Fix Jira Authentication

First, we need to resolve the authentication issue. Contact your Disney Jira administrator and ask:

**Questions to ask:**
1. "What authentication method should I use for Jira REST API access?"
2. "Do I need a Personal Access Token (PAT) or API token?"
3. "Is there a specific endpoint or proxy for API access?"
4. "Do I need to be on VPN to access the API?"

**Common Disney Jira auth methods:**
- Personal Access Token (most likely)
- OAuth 2.0
- Basic Auth with API token
- SSO/SAML (may require special setup)

### Step 2: Add GitHub Secrets

Once you have working Jira credentials:

1. Go to your GitHub repository: https://github.com/chakn005/Content_flow_Integration

2. Click **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret**

4. Add two secrets:

   **Secret 1: JIRA_USERNAME**
   - Name: `JIRA_USERNAME`
   - Value: `niloy.chakraborty@disney.com`
   
   **Secret 2: JIRA_TOKEN**
   - Name: `JIRA_TOKEN`
   - Value: Your Jira API token or PAT (paste the token you got from Step 1)

5. Click **Add secret** for each

### Step 3: Test the Workflow

1. Go to **Actions** tab in your GitHub repository

2. Click on **Sync Jira Data** workflow

3. Click **Run workflow** → **Run workflow**

4. Wait 1-2 minutes and check the results

**If successful:** ✅ You'll see a green checkmark and a new commit with Jira data

**If failed:** ❌ Click on the failed run to see error logs, then see Troubleshooting below

### Step 4: Verify the Sync

1. Check the latest commit - should say "🔄 Auto-sync Jira data from CPTR-68587"

2. Open `jira-config.json` - should have updated data

3. Visit https://chakn005.github.io/Content_flow_Integration/
   - Epic badge should show current status
   - Evidence section should show linked tickets
   - Heatmap should reflect execution status

## How It Works

### Automatic Schedule
- Runs **daily at 9 AM UTC** (4 AM EST / 1 AM PST)
- Adjust the cron schedule in `.github/workflows/sync-jira.yml` if needed

### Manual Trigger
- Go to **Actions** → **Sync Jira Data** → **Run workflow**
- Use this to sync immediately after Jira updates

### What Gets Synced

| Jira Data | Where It Appears |
|-----------|------------------|
| Ticket status | Epic badge, Evidence section |
| Linked issues | Evidence section |
| Test executions | Evidence section, Heatmap |
| Components | KPI cards |
| Description | Risks section |
| Labels | Evidence metadata |

### Execution Status → Heatmap Mapping

| Jira Status | Heatmap Color | Meaning |
|-------------|---------------|---------|
| Done, Completed, Closed | 🟢 Green | COMPLETED |
| In Progress, In Review | 🟡 Amber | IN-PROGRESS |
| To Do, Open | ⚪ Pending | PENDING |
| Blocked, Impediment | 🔴 Red | RISK |

## Troubleshooting

### Error: 401 Unauthorized

**Cause:** Authentication credentials are incorrect or expired

**Solutions:**
1. Verify your Jira token hasn't expired
2. Check if you need a Personal Access Token instead of API token
3. Confirm you're using the correct username format
4. Try generating a new token

**Test manually:**
```bash
curl -u "niloy.chakraborty@disney.com:YOUR_TOKEN" \
  -H "Accept: application/json" \
  "https://jira.disney.com/rest/api/2/myself"
```

If this returns your user info, your credentials work!

### Error: Network timeout or connection refused

**Cause:** GitHub Actions can't reach Disney's Jira (firewall/VPN)

**Solutions:**
1. Check if Disney Jira requires VPN access
2. Ask IT if there's a public API endpoint
3. Consider using a self-hosted GitHub runner on Disney network
4. Alternative: Run sync locally and commit manually

### Error: Permission denied

**Cause:** GitHub token doesn't have write permissions

**Solution:**
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Click **Save**

### Sync runs but no changes

**Cause:** Jira data hasn't changed since last sync

**This is normal!** The workflow only commits if data actually changed.

### Want to change sync frequency?

Edit `.github/workflows/sync-jira.yml`:

```yaml
schedule:
  - cron: '0 9 * * *'  # Daily at 9 AM UTC
```

**Common schedules:**
- Every 6 hours: `'0 */6 * * *'`
- Every hour: `'0 * * * *'`
- Twice daily (9 AM & 9 PM): `'0 9,21 * * *'`
- Weekdays only at 9 AM: `'0 9 * * 1-5'`

Use [crontab.guru](https://crontab.guru/) to create custom schedules.

## Alternative: Local Sync

If GitHub Actions doesn't work (VPN issues, etc.), you can sync locally:

### Setup (one-time)
```bash
cd "/Users/CHAKN005/AI training/content-integration-flow"

# Your credentials are already in jira-credentials.json
```

### Run sync manually
```bash
node scripts/sync-jira.js
git add jira-config.json
git commit -m "Update Jira data"
git push origin main
```

### Automate locally with cron (Mac)
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd "/Users/CHAKN005/AI training/content-integration-flow" && node scripts/sync-jira.js && git add jira-config.json && git commit -m "Update Jira data" && git push origin main
```

## Advanced Configuration

### Sync Multiple Tickets

Edit `jira-config.json` to add more tickets:

```json
{
  "tickets": [
    {
      "key": "CPTR-68587",
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

The sync script will fetch all of them automatically.

### Custom Status Mapping

Edit `jira-config.json` to customize how Jira statuses map to your project:

```json
{
  "mapping": {
    "jiraStatusToProjectStatus": {
      "Open": "pending",
      "In Progress": "in-progress",
      "Code Review": "review",
      "Done": "completed",
      "Blocked": "blocked"
    }
  }
}
```

### Notifications on Sync

Add Slack/email notifications to the workflow:

```yaml
- name: Notify on sync
  if: steps.git-check.outputs.changed == 'true'
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"Jira data synced for Content Flow Integration"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Security Notes

- ✅ Credentials are stored as GitHub Secrets (encrypted)
- ✅ Credentials are never committed to the repository
- ✅ Credentials are cleaned up after each run
- ✅ Only the bot account can trigger the workflow
- ⚠️ Keep your Jira token secure - don't share it

## Support

**For Jira authentication issues:**
- Contact Disney IT or Jira administrators
- Reference: JIRA_AUTH_TROUBLESHOOTING.md

**For GitHub Actions issues:**
- Check the Actions tab for error logs
- Verify secrets are set correctly
- Ensure workflow permissions are enabled

**For sync script issues:**
- Check `scripts/sync-jira.js` for errors
- Test locally first: `node scripts/sync-jira.js`
- Review console output for detailed errors

## Next Steps

1. ✅ Fix Jira authentication (contact IT if needed)
2. ✅ Add GitHub Secrets (JIRA_USERNAME, JIRA_TOKEN)
3. ✅ Test the workflow manually
4. ✅ Verify data appears on your site
5. ✅ Let it run automatically daily

Your site will now stay in sync with Jira automatically! 🎉
