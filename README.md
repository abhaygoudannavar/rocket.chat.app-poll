# Enhanced Polls App for Rocket.Chat

A feature-rich polling application for Rocket.Chat with visual charts, multi-round voting, anonymous polls, and export capabilities.

## Features

- **Visual Vote Charts** - Clean bar graphs showing vote distribution
- **Multi-Round Voting** - Run elimination-style polls with multiple rounds
- **Anonymous Polls** - Hide voter identities for confidential voting
- **Vote Controls** - Single or multiple choice, allow/block vote changes
- **Duration Limits** - Auto-close polls after a set time
- **Export Results** - Download results as CSV or JSON
- **Real-time Updates** - Vote counts update instantly

## Installation

### Prerequisites
- Rocket.Chat server (v3.0+)
- Apps-Engine enabled
- Node.js 14+ and npm

### Deploy the App

```bash
# Clone the repository
git clone <repo-url>
cd rocket.chat.app-poll

# Install dependencies
npm install

# Deploy to your Rocket.Chat server
rc-apps deploy --url http://your-server:3000 --username admin --password yourpass --update
```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `/poll` | Open the poll creation form |
| `/poll help` | Show help message with usage tips |
| `/poll export <poll-id>` | Export poll results to your DM |

### Creating a Poll

1. Type `/poll` in any channel or DM
2. Fill in the poll question
3. Add at least 2 options
4. Configure settings:
   - **Vote Mode**: Single or multiple choice
   - **Visibility**: Open (show voters) or Anonymous
   - **Results**: Show always or only after close
   - **Change Vote**: Allow or block vote changes
   - **Duration**: No limit, 5 min, 15 min, 1 hour, 1 day
5. Click "Create"

### Multi-Round Voting

For elimination-style polls (like voting shows):

1. Set "Rounds" to 2, 3, or 4
2. Set "Keep per round" to specify how many options survive
3. Click "Next Round" to eliminate bottom options
4. Continue until final round

### Poll Actions

| Button | Description |
|--------|-------------|
| Vote | Cast your vote on an option |
| View Results | Open detailed results modal |
| Close Poll | End the poll (creator only) |
| Next Round | Advance multi-round poll |
| Export | Download results as CSV/JSON |

## Poll Card Layout

```
**What's your favorite color?**

LIVE  •  Single choice  •  Round 1/3  •  15 votes
────────────────────────────────────────
Red                                [Vote]
`████████████░░░░░░░░` 60.0% (9 votes)

Blue                               [Vote]
`████████░░░░░░░░░░░░` 40.0% (6 votes)

────────────────────────────────────────
[View Results] [Close Poll] [Next Round] [Export]
```

## Configuration Settings

Access via Admin → Apps → Poll → Settings:

| Setting | Description |
|---------|-------------|
| `use-user-name` | Show display names instead of usernames |

## Export Formats

### CSV Export
```csv
Poll Results: What's your favorite color?
Status: Closed
Total Votes: 15

Option,Votes,Percentage,Voters
"Red",9,60.0%,"@user1;@user2;@user3"
"Blue",6,40.0%,"@user4;@user5"
```

### JSON Export
```json
{
  "poll": {
    "id": "abc123",
    "question": "What's your favorite color?",
    "status": "closed"
  },
  "results": {
    "totalVotes": 15,
    "options": [
      { "text": "Red", "votes": 9, "percentage": "60.0%" }
    ]
  }
}
```

## Development

```bash
# Watch mode for development
npm run watch

# Type check
npm run typecheck

# Deploy update
rc-apps deploy --update
```

## License

MIT
