# 📊 Rocket.Chat Poll App

A feature-rich polling application for Rocket.Chat with visual charts, multi-round voting, anonymous polls, and export capabilities.

---

## ✨ Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎨 **Visual Vote Bars** | Clean emoji-based progress bars showing vote distribution |
| 🔄 **Multi-Round Voting** | Elimination-style polls with multiple rounds |
| 🕵️ **Anonymous Polls** | Hide voter identities for confidential voting |
| ✅ **Vote Controls** | Single/multiple choice, allow/block vote changes |
| 📤 **Export Results** | Send results to DM or post in room |
| ⚡ **Real-time Updates** | Vote counts update instantly |

---

## 🚀 Quick Start

### Prerequisites

- Rocket.Chat server (v3.0+)
- Apps-Engine enabled
- Node.js 14+ and npm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd rocket.chat.app-poll

# 2. Install dependencies
npm install

# 3. Deploy to your Rocket.Chat server
rc-apps deploy --url http://localhost:3000 --username admin --password yourpass --update
```

---

## 📖 Usage Guide

### Available Commands

| Command | Description |
|---------|-------------|
| `/poll` | Open the poll creation form |
| `/poll help` | Show help message with usage tips |
| `/poll export <poll-id>` | Export poll results to your DM |

---

## 🎯 Creating a Poll

### Step 1: Open the Form
Type `/poll` in any channel or direct message.

### Step 2: Fill in Details

```
┌─────────────────────────────────────────────┐
│           Create a Poll                     │
├─────────────────────────────────────────────┤
│ Question:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ What's your favorite programming lang? │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Options:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ JavaScript                              │ │
│ ├─────────────────────────────────────────┤ │
│ │ Python                                  │ │
│ ├─────────────────────────────────────────┤ │
│ │ TypeScript                              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ Add a choice]                            │
└─────────────────────────────────────────────┘
```

### Step 3: Configure Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **Vote Type** | Open / Confidential / Mixed | Show or hide voter names |
| **Add Choices** | Yes / No | Let users add their own options |
| **Multiple Choices** | Single / Multiple | Allow one or many selections |
| **Allow Vote Change** | Yes / No | Let users change their vote |
| **Number of Rounds** | 1-4 rounds | Enable multi-round elimination |

### Step 4: Create
Click the **Create** button to post the poll!

---

## 📊 Poll Display

When a poll is created, it appears like this:

```
┌─────────────────────────────────────────────────────┐
│ What's your favorite programming language?          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ JavaScript                               [Vote]     │
│ 🟦🟦🟦🟦🟦⬜⬜⬜⬜⬜  50.00% (5)                     │
│ 5 votes - alice, bob, charlie...                    │
│                                                     │
│ Python                                   [Vote]     │
│ 🟦🟦🟦⬜⬜⬜⬜⬜⬜⬜  30.00% (3)                     │
│ 3 votes - david, eve, frank                         │
│                                                     │
│ TypeScript                               [Vote]     │
│ 🟦🟦⬜⬜⬜⬜⬜⬜⬜⬜  20.00% (2)                     │
│ 2 votes - grace, henry                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 10 votes total  •  Single choice                    │
│                                                     │
│ [Finish poll]  [Export]                             │
└─────────────────────────────────────────────────────┘
```

### Vote Bar Legend
- 🟦 = Filled (votes received)
- ⬜ = Empty (remaining percentage)

---

## 🔄 Multi-Round Voting

Perfect for elimination-style competitions (like voting shows):

### How It Works

```
Round 1                    Round 2                    Final
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│ Option A ███ │           │ Option A ███ │           │ Option A █████│ ← Winner!
│ Option B ██  │    →      │ Option C ██  │    →      │ Option C ███ │
│ Option C ██  │           │              │           │              │
│ Option D █   │ ← Out!    │              │           │              │
└──────────────┘           └──────────────┘           └──────────────┘
```

### Setup
1. Set **Number of Rounds** to 2, 3, or 4
2. After voting, click **Next Round** to eliminate bottom options
3. Continue until final round

---

## 📤 Export Results

### Method 1: Click Export Button
Click the **Export** button on any poll to open the export modal:

| Destination | Description |
|-------------|-------------|
| Send to me (DM) | Private message with results |
| Post in Room | Share results in the channel |

### Method 2: Use Command
```
/poll export <poll-id>
```

### Export Format

```
══════════════════════════════════════════════════
POLL RESULTS
══════════════════════════════════════════════════

Question: What's your favorite programming language?

Created by: @abhay
Created at: December 6, 2024, 04:30 PM
Status: Closed
Total Votes: 10
Vote Mode: Single choice
Visibility: Open

──────────────────────────────────────────────────
OPTIONS & RESULTS
──────────────────────────────────────────────────

• JavaScript
  Votes: 5 (50.00%)
  Voters: @alice, @bob, @charlie, @david, @eve

• Python
  Votes: 3 (30.00%)
  Voters: @frank, @grace, @henry

• TypeScript
  Votes: 2 (20.00%)
  Voters: @ivan, @julia

══════════════════════════════════════════════════
Exported on: December 6, 2024, 04:35 PM
══════════════════════════════════════════════════
```

---

## 🏗️ Project Structure

```
rocket.chat.app-poll/
├── PollApp.ts                 # Main app entry point
├── app.json                   # App configuration
├── src/
│   ├── PollCommand.ts         # Slash command handler
│   ├── definition/            # TypeScript interfaces
│   │   ├── IPoll.ts           # Poll data structure
│   │   ├── IVote.ts           # Vote/voter interfaces
│   │   ├── IRound.ts          # Multi-round data
│   │   ├── IExportData.ts     # Export formats
│   │   └── enums.ts           # Status enums
│   ├── handlers/              # Action handlers
│   │   ├── exportHandler.ts   # Export button/modal
│   │   ├── finishHandler.ts   # Close poll
│   │   ├── nextRoundHandler.ts# Multi-round advance
│   │   └── viewResultsHandler.ts
│   └── lib/
│       ├── ui/                # UI components
│       │   ├── createPollModal.ts    # Creation form
│       │   ├── createPollBlocks.ts   # Poll display
│       │   ├── createResultsModal.ts # Results modal
│       │   └── createExportModal.ts  # Export modal
│       ├── poll/              # Poll operations
│       │   ├── createPollMessage.ts
│       │   └── getPoll.ts
│       ├── voting/            # Vote logic
│       │   └── storeVote.ts
│       └── export/            # Export logic
│           └── ExportService.ts
```

---

## ⚙️ Configuration

Access via **Admin → Apps → Poll → Settings**:

| Setting | Description |
|---------|-------------|
| `use-user-name` | Show display names instead of usernames |

---

## 🛠️ Development

```bash
# Watch mode for development
npm run watch

# Type check
npm run typecheck

# Deploy update
rc-apps deploy --update
```

---

## 📝 Poll Actions Reference

### During Active Poll

| Button | Who Can Use | Action |
|--------|-------------|--------|
| Vote | Anyone | Cast/change vote on an option |
| Finish poll | Creator only | Close the poll |
| Next round | Creator only | Advance multi-round poll |
| Export | Anyone | Export current results |

### After Poll Closed

| Button | Who Can Use | Action |
|--------|-------------|--------|
| Export results | Anyone | Export final results |

---

## 🔒 Privacy & Visibility

| Mode | Voter Names | Vote Counts |
|------|-------------|-------------|
| **Open** | ✅ Visible | ✅ Visible |
| **Confidential** | ❌ Hidden | ✅ Visible |
| **Mixed** | Partially visible | ✅ Visible |

---

## 📄 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
