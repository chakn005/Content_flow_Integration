# Quick Start: Jira Auto-Sync

## 🚀 3-Step Setup (5 minutes)

### Step 1: Get Jira Credentials
Contact Disney IT/Jira admin and get:
- Your Jira username: `niloy.chakraborty@disney.com` ✅
- Jira API token or Personal Access Token (PAT)

**Test your credentials:**
```bash
curl -u "niloy.chakraborty@disney.com:YOUR_TOKEN" \
  "https://jira.disney.com/rest/api/2/myself"
```

If you see your user info → credentials work! ✅

---

### Step 2: Add Secrets to GitHub

1. Go to: https://github.com/chakn005/Content_flow_Integration/settings/secrets/actions

2. Click **New repository secret**

3. Add these two secrets:

   | Name | Value |
   |------|-------|
   | `JIRA_USERNAME` | `niloy.chakraborty@disney.com` |
   | `JIRA_TOKEN` | Your Jira token from Step 1 |

---

### Step 3: Enable Workflow Permissions

1. Go to: https://github.com/chakn005/Content_flow_Integration/settings/actions

2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**

3. Click **Save**

---

## ✅ Test It Now

1. Go to: https://github.com/chakn005/Content_flow_Integration/actions

2. Click **Sync Jira Data** → **Run workflow** → **Run workflow**

3. Wait 1-2 minutes

4. Check results:
   - ✅ Green checkmark = Success!
   - ❌ Red X = See error logs

---

## 🎯 What Happens Next

### Automatic Daily Sync
- Runs every day at 9 AM UTC
- Fetches data from CPTR-68587
- Updates heatmap, evidence, risks
- Commits changes automatically
- Deploys to GitHub Pages

### Manual Sync Anytime
Go to Actions → Sync Jira Data → Run workflow

---

## 🔍 Verify It's Working

Visit: https://chakn005.github.io/Content_flow_Integration/

Check:
- ✅ Epic badge shows current status
- ✅ Evidence section shows linked tickets
- ✅ Heatmap reflects test execution status
- ✅ Sync indicator shows last update time

---

## 🆘 Troubleshooting

### ❌ 401 Unauthorized Error
**Fix:** Your Jira token is wrong or expired
- Generate a new token
- Update the `JIRA_TOKEN` secret in GitHub
- Try again

### ❌ Network Error
**Fix:** Disney Jira might require VPN
- Ask IT if API access requires VPN
- Consider running sync locally instead

### ❌ No Changes Committed
**Fix:** This is normal if Jira data hasn't changed
- The workflow only commits when data actually updates

---

## 📖 Full Documentation

- **Complete setup guide:** `JIRA_AUTO_SYNC_SETUP.md`
- **Authentication help:** `JIRA_AUTH_TROUBLESHOOTING.md`
- **Manual updates:** `UPDATE_JIRA_DATA.md`

---

## 🎉 Done!

Your site now auto-syncs with Jira daily. No manual updates needed!

**Questions?** Check the full guides or contact your Jira admin.
