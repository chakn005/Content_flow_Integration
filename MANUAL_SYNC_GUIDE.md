# Manual Jira Sync Guide

Since automatic API sync isn't working yet, use these methods to manually update your Jira data.

## 🎯 Two Easy Methods

### Method 1: Web Form (Easiest) ⭐

1. **Open the form:**
   ```bash
   open jira-update-form.html
   ```
   Or visit: https://chakn005.github.io/Content_flow_Integration/jira-update-form.html

2. **Update the data:**
   - Form loads current data automatically
   - Edit ticket details (title, status, priority, etc.)
   - Add/remove test executions
   - Click "Generate JSON"

3. **Copy the JSON:**
   - Copy the entire generated JSON from the output box

4. **Save to file:**
   ```bash
   # Open jira-config.json in your editor
   open jira-config.json
   
   # Paste the copied JSON (replace everything)
   # Save the file
   ```

5. **Push to GitHub:**
   ```bash
   git add jira-config.json
   git commit -m "Update Jira data from CPTR-68587"
   git push origin main
   ```

6. **Done!** Your site updates in 2-3 minutes ✅

---

### Method 2: Interactive CLI

1. **Run the script:**
   ```bash
   node scripts/manual-jira-update.js
   ```

2. **Follow the menu:**
   ```
   1. View current data
   2. Update main ticket (CPTR-68587)
   3. Quick status update
   4. Add test execution
   5. Remove test execution
   6. Save and exit
   ```

3. **Make your changes** using the interactive prompts

4. **Save and exit** (option 6)

5. **Push to GitHub:**
   ```bash
   git add jira-config.json
   git commit -m "Update Jira data"
   git push origin main
   ```

---

## 📊 What to Update

### Main Ticket (CPTR-68587)
- **Title**: Brief description of the epic
- **Status**: Open, In Progress, In Review, Done, Blocked
- **Priority**: Low, Medium, High, Critical
- **Assignee**: Who's responsible
- **Description**: Detailed description (include risks if any)

### Test Executions
Add each test execution with:
- **Key**: Jira ticket number (e.g., CPTR-68701)
- **Summary**: What the test covers
- **Status**: Done, In Progress, To Do, Blocked
- **Type**: Usually "Test"

### How Executions Affect the Heatmap

| Execution Status | Heatmap Color | Meaning |
|------------------|---------------|---------|
| Done, Completed | 🟢 Green | COMPLETED |
| In Progress | 🟡 Amber | IN-PROGRESS |
| To Do, Open | ⚪ Pending | PENDING |
| Blocked | 🔴 Red | RISK |

**Execution categorization by keywords:**
- "content", "metadata", "ingestion" → Content Platform
- "media", "encoding", "drm" → Media Platform
- "localization", "language", "ui" → UI Localization
- "streaming", "playback", "client" → Streaming

---

## 🎯 Quick Update Workflow

### Daily Status Update (30 seconds)

1. Open form: `open jira-update-form.html`
2. Change status dropdown
3. Click "Generate JSON"
4. Copy → Paste to jira-config.json
5. Push to GitHub

### Add New Test Execution (1 minute)

1. Open form
2. Scroll to "Add New Execution"
3. Fill in: Key, Summary, Status
4. Click "+ Add Execution"
5. Click "Generate JSON"
6. Copy → Paste → Push

### Bulk Update (5 minutes)

1. Open form
2. Update all fields
3. Add multiple executions
4. Generate JSON
5. Copy → Paste → Push

---

## 📝 Example Updates

### Example 1: Mark Content Platform Tests as Done

```
Execution Key: CPTR-68701
Summary: Content Platform - Metadata and Ingestion Tests
Status: Done
```

Result: Content Platform row in heatmap turns GREEN ✅

### Example 2: Add Blocked Media Test

```
Execution Key: CPTR-68702
Summary: Media Platform - DRM Validation Blocked
Status: Blocked
```

Result: Media Platform row in heatmap turns RED ⚠️

### Example 3: Update Epic Status

```
Status: In Review
Description: E2E integration complete, awaiting final approval. Risk: Deployment window may be tight.
```

Result: Epic badge shows "In Review", risks section updated

---

## 🔄 Update Frequency

**Recommended:**
- Update after each test execution completes
- Update when epic status changes
- Update when blockers are identified
- At least once per day during active development

**Quick updates take 30 seconds!**

---

## ✅ Verification

After pushing, verify your changes:

1. Wait 2-3 minutes for GitHub Pages to rebuild
2. Visit: https://chakn005.github.io/Content_flow_Integration/
3. Check:
   - ✅ Epic badge shows correct status
   - ✅ Evidence section shows all executions
   - ✅ Heatmap reflects execution statuses
   - ✅ Sync indicator shows recent update time

---

## 🆘 Troubleshooting

### Form doesn't load current data
- Make sure you're viewing the form from the same directory as jira-config.json
- Or use the deployed version: https://chakn005.github.io/Content_flow_Integration/jira-update-form.html

### Changes not showing on site
- Clear browser cache (Cmd+Shift+R)
- Wait 2-3 minutes for GitHub Pages
- Check that jira-config.json was pushed successfully

### Lost my changes
- Check git history: `git log --oneline`
- Restore previous version: `git checkout HEAD~1 jira-config.json`

---

## 🚀 When API Sync is Fixed

Once you get working Jira credentials:

1. Add them to GitHub Secrets
2. The workflow will run automatically
3. No more manual updates needed!

Until then, manual updates take just 30 seconds and work perfectly! 💪

---

## 📖 Related Guides

- **QUICK_START_JIRA_SYNC.md** - Setting up automatic sync
- **JIRA_AUTH_TROUBLESHOOTING.md** - Fixing authentication
- **UPDATE_JIRA_DATA.md** - Detailed update instructions
