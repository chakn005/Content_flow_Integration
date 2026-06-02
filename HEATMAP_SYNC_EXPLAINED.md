# Coverage Heatmap - Jira Sync Explained

## How It Works

The Coverage Heatmap on your site **automatically syncs with Jira test execution statuses**.

### Data Flow

```
Jira CPTR-68587 
  ↓
jira-config.json (synced daily or manually)
  ↓
jira-integration.js (loads on page)
  ↓
Heatmap cells updated based on test execution statuses
```

## Automatic Categorization

The 14 test executions from CPTR-68587 are automatically categorized into alliances:

### Content Platform
Executions containing: `FDA`, `Metadata`, `Artwork`, `Assets`, `Rights`, `Avails`
- ✅ RIGHTS-27423 - FDA Test Plan (Done)
- ✅ PRODREQ-88253 - Metadata & Artwork validation (Done)
- ✅ OMFG-19253 - Metadata & Artwork integration (Done)
- 🆕 CPTR-69483 - Assets, Rights & Avails (New)
- 🔄 PRODREQ-93064 - Vibranium avail creation (Open)

### Media Platform
Executions containing: `AMP`, `SIP`, `BOLT`, `Vibranium`, `Encoding`, `DRM`
- ✅ OMFG-18837 - AMP Hotstar Migration (Done)
- ✅ DMEDNINJA-16594 - SIP Regression (Done)
- ✅ BOLTM-7048 - BOLT Migration (Done)
- 📋 MDETESTQA-3447 - Vibranium Test Plan (Backlog)

### UI Localization
Executions containing: `LQA`, `Localization`, `Language`, `UI`
- 🔄 LOCQA-144 - Localization QA (Open)

### Streaming/Client
Executions containing: `Disney+`, `Client`, `Xavier`, `BELLE`, `Streaming`
- ✅ EXP-4184 - Xavier Test Plan (Done)
- ✅ GPLBELLE-3971 - BELLE Test Plan (Done)
- 📋 DPQA-6323 - Disney+ Client Test (Backlog)

### Cross-Fleet Integration
Executions containing: `Integration`, `CrossFleet`, `Traceability`
- 🔄 CPTR-68465 - Integration traceability (In Progress)
- *(This execution updates ALL alliances)*

## Status Mapping

Jira execution statuses automatically map to heatmap colors:

| Jira Status | Heatmap Color | Display |
|-------------|---------------|---------|
| **Done** / Completed / Closed | 🟢 Green | COMPLETED |
| **In Progress** / In Review | 🟠 Amber | IN-PROGRESS |
| **To Do** / Open | ⚪ Gray | PENDING |
| **Blocked** / Impediment | 🔴 Red | RISK |

## How Status is Determined

For each alliance (Content, Media, Localization, Streaming):
1. All matching executions are found
2. Status counts are tallied (Done: 3, In Progress: 1, etc.)
3. The **predominant status** is applied to the first heatmap milestone (Metadata/Artwork)

**Example:**
- Content Platform has: 4 Done, 1 Open
- Predominant status: **Done** (4 > 1)
- Heatmap shows: 🟢 **COMPLETED**

## When Does It Update?

### Automatically (GitHub Actions)
- Every day at 9 AM UTC
- Syncs CPTR-68587 data
- Updates jira-config.json
- Site rebuilds in 2-3 minutes
- Heatmap reflects new statuses

### Manually (Anytime)
```bash
node scripts/sync-jira.js
git add jira-config.json
git commit -m "Update Jira data"
git push origin main
```

### On Page Load
- Browser fetches jira-config.json
- jira-integration.js processes executions
- Heatmap cells are automatically updated
- Manual changes you make are preserved in localStorage

## User Interaction

**You can still manually change heatmap cells!**
- Click any cell to cycle: COMPLETED → IN-PROGRESS → PENDING → RISK → N/A
- Your manual changes are saved in your browser
- But they'll be overwritten when Jira data updates

**Best Practice:**
- Let Jira data drive the "Metadata/Artwork" column (first column)
- Manually set other milestones as needed

## Current Heatmap Status

Based on your latest Jira sync (June 2, 2026):

### Content Platform: 🟢 COMPLETED
- 4 test plans Done
- 1 Open
- Predominant: Done

### Media Platform: 🟢 COMPLETED
- 3 test plans Done  
- 1 Backlog
- Predominant: Done

### UI Localization: 🟠 IN-PROGRESS
- 1 test plan Open
- Predominant: Open → IN-PROGRESS

### Streaming: 📋 PENDING/COMPLETED (Mixed)
- 2 test plans Done
- 1 Backlog
- May show as Backlog → PENDING

## Technical Details

### Files Involved
- **jira-config.json**: Stores execution data
- **jira-integration.js**: Categorizes and maps to heatmap
- **app.js**: Renders heatmap cells
- **shared-state.js**: (Not used - Supabase optional)

### Functions Called
```javascript
// On page load:
loadJiraData()
  → updatePageWithJiraData()
    → updateHeatmapFromJira()
      → categorizes executions
      → maps statuses
      → updates localStorage
      → refreshHeatmapFromState()
```

### localStorage Keys
- `heatmapCellStates-v4:<pathname>` - Cell states per alliance/milestone
- Scoped by pathname to avoid conflicts with other projects

## Troubleshooting

### Heatmap not updating from Jira?
1. Check browser console for errors
2. Verify jira-config.json has executions:
   ```bash
   cat jira-config.json | jq '.tickets[0].executions | length'
   ```
3. Should show: `14`

### Wrong colors showing?
1. Check execution summaries match keywords
2. Update categorization in `jira-integration.js`
3. Run sync again: `node scripts/sync-jira.js`

### Manual changes being lost?
- This is expected! Jira data overwrites on page load
- Solution: Only manually edit columns 2-5 (not "Metadata/Artwork")

## Summary

✅ **Heatmap DOES sync with Jira execution statuses**  
✅ **Automatic categorization by project names (FDA, AMP, BELLE, etc.)**  
✅ **Status mapping: Done→Green, In Progress→Amber, Open→Pending**  
✅ **Updates automatically when jira-config.json changes**  
✅ **Manual overrides possible but will be replaced on next sync**

Your heatmap reflects the real status of test executions from CPTR-68587! 🎯
