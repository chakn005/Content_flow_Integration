# How to Update Jira Data on Your Site

Your site at https://chakn005.github.io/Content_flow_Integration/ now automatically displays data from `jira-config.json`. 

## What Gets Synced

The site automatically pulls and displays:
- ✅ Epic status in the header badge
- ✅ Linked issues in the Evidence section
- ✅ Test executions and their status
- ✅ Risk information from Jira
- ✅ Component assignments
- ✅ Last sync timestamp

## Option 1: Automatic Sync (Once Authentication is Fixed)

Once we resolve the Jira authentication issue, simply run:

```bash
node scripts/sync-jira.js
git add jira-config.json
git commit -m "Update Jira data"
git push origin main
```

The site will automatically update within a few minutes.

## Option 2: Manual Update (Current Workaround)

Until authentication is fixed, you can manually update `jira-config.json`:

### Step 1: Open jira-config.json

```bash
open jira-config.json
```

### Step 2: Update the ticket information

Go to https://jira.disney.com/browse/CPTR-68587 and copy the information:

```json
{
  "tickets": [
    {
      "key": "CPTR-68587",
      "url": "https://jira.disney.com/browse/CPTR-68587",
      "title": "YOUR TICKET TITLE FROM JIRA",
      "description": "YOUR TICKET DESCRIPTION",
      "status": "In Progress",
      "priority": "High",
      "assignee": "Your Name",
      "reporter": "Reporter Name",
      "created": "2026-06-01T10:00:00.000Z",
      "updated": "2026-06-01T15:00:00.000Z",
      "labels": ["content-migration", "e2e-integration"],
      "components": ["Content Platform", "Media Platform"],
      "linkedIssues": [
        {
          "key": "CPTR-12345",
          "type": "relates to",
          "direction": "outward"
        }
      ],
      "executions": [
        {
          "key": "CPTR-12346",
          "summary": "Test execution summary",
          "status": "Done",
          "type": "Test",
          "url": "https://jira.disney.com/browse/CPTR-12346"
        }
      ]
    }
  ],
  "sync": {
    "enabled": true,
    "lastSyncDate": "2026-06-01T15:21:55.328Z"
  }
}
```

### Step 3: Push to GitHub

```bash
git add jira-config.json
git commit -m "Update Jira data from CPTR-68587"
git push origin main
```

### Step 4: Verify

Visit https://chakn005.github.io/Content_flow_Integration/ and you'll see:
- Epic badge shows the current status
- Evidence section shows all linked tickets
- Risks section includes Jira-sourced information
- Sync indicator shows when data was last updated

## What Shows Up Where

| Jira Field | Where It Appears on Site |
|------------|-------------------------|
| Ticket Status | Epic badge in header |
| Linked Issues | Evidence section |
| Executions | Evidence section with status |
| Components | KPI cards (if matching) |
| Description (with "risk") | Risks section |
| Last Sync Date | Sync indicator in header |

## Adding More Tickets

To track additional tickets, add them to the `tickets` array in `jira-config.json`:

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
      "title": "Another ticket",
      ...
    }
  ]
}
```

All tickets will be displayed in the Evidence section.

## Troubleshooting

**Q: Changes not showing up?**
- Clear your browser cache (Cmd+Shift+R on Mac)
- Wait 2-3 minutes for GitHub Pages to rebuild
- Check that jira-config.json was pushed successfully

**Q: Want to automate this?**
- Fix the Jira authentication (see JIRA_AUTH_TROUBLESHOOTING.md)
- Set up a GitHub Action to run the sync script daily
- Or run the sync script manually before each push

**Q: How often should I update?**
- Update whenever CPTR-68587 status changes
- Update when new linked tickets are added
- Update when test executions complete

## Next Steps

1. **Fix Authentication**: Work with Disney IT to get proper API access
2. **Automate**: Set up daily sync once authentication works
3. **Expand**: Add more tickets to track as needed

The site is now live and will automatically display whatever data is in `jira-config.json`!
