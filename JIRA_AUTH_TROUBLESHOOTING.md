# Jira Authentication Troubleshooting

## Current Issue

We're getting a `401 Unauthorized` error when trying to connect to Disney's Jira instance.

**Error Message:**
```
Basic Authentication Failure - Reason : AUTHENTICATED_FAILED
```

## Possible Causes & Solutions

### 1. **Disney Jira Uses Different Authentication**

Disney's Jira might use:
- **SSO/SAML** authentication instead of API tokens
- **OAuth** authentication
- **Personal Access Tokens (PAT)** instead of API tokens
- **VPN requirement** for API access

**Solution:** Contact your Disney Jira administrator to ask:
- "What authentication method should I use for Jira REST API access?"
- "Do I need a Personal Access Token or API token?"
- "Is VPN required for API access?"

### 2. **Token Format Issue**

The token format might need to be different.

**Current format we're using:**
```
Authorization: Basic base64(email:token)
```

**Try these alternatives:**

#### Option A: Bearer Token
Some Jira instances use Bearer tokens:
```javascript
headers: {
  'Authorization': `Bearer ${credentials.jiraToken}`,
  'Accept': 'application/json'
}
```

#### Option B: Cookie-based Authentication
Disney Jira might require cookie-based auth with username/password.

### 3. **Token Permissions**

Your token might not have the right permissions.

**Required permissions:**
- Browse Projects
- View Issues
- Access Jira (basic access)

**Solution:** Check with your Jira admin that your token has these permissions.

### 4. **Network/VPN Requirements**

Disney's Jira might require:
- Connection from Disney network
- VPN connection
- IP whitelist

**Solution:** Try running the sync script while connected to Disney VPN.

### 5. **Token Generation Method**

**For Atlassian Cloud Jira:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token

**For Jira Data Center/Server (Disney likely uses this):**
1. Go to Jira → Profile → Personal Access Tokens
2. Create a new token
3. Copy the token immediately (it won't be shown again)

## Testing Authentication Manually

Try this curl command to test authentication:

```bash
curl -u "niloy.chakraborty@disney.com:YOUR_TOKEN" \
  -H "Accept: application/json" \
  "https://jira.disney.com/rest/api/2/myself"
```

If this works, you'll see your user profile. If not, you'll see the same 401 error.

## Alternative: Use Browser Session

If API tokens don't work, we can modify the script to:
1. Use Puppeteer to log in through the browser
2. Extract the session cookies
3. Use those cookies for API requests

## Next Steps

1. **Contact Disney Jira Admin** - Ask about the correct authentication method
2. **Try VPN** - Connect to Disney VPN and run the sync script again
3. **Test with curl** - Use the curl command above to verify authentication
4. **Check token type** - Verify you're using the right type of token (API token vs PAT)

## Manual Workaround (Temporary)

Until we fix the authentication, you can manually update `jira-config.json` with ticket information:

```json
{
  "tickets": [
    {
      "key": "CPTR-68587",
      "url": "https://jira.disney.com/browse/CPTR-68587",
      "title": "Your ticket title",
      "description": "Ticket description",
      "status": "In Progress",
      "priority": "High",
      "assignee": "Your Name",
      "reporter": "Reporter Name",
      "created": "2026-06-01",
      "updated": "2026-06-01",
      "labels": ["label1", "label2"],
      "components": [],
      "linkedIssues": [],
      "executions": []
    }
  ]
}
```

The dashboard will display this information even without API access.

## Contact

For Disney-specific Jira API questions, contact your Jira administrator or IT support.
