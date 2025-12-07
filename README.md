# Discord File Host

A static GitHub Pages website that automatically displays files uploaded to a Discord channel.

## 🏗️ Architecture

```
Discord Channel → GitHub Actions (scheduled) → files.json → Static Site
```

- **No backend server** - purely static HTML/CSS/JS
- **No always-online bot** - uses Discord REST API only
- **Safe for GitHub Actions** - short-lived jobs that exit quickly

## 📁 Repository Structure

```
├── .github/workflows/update-files.yml  # Scheduled sync job
├── docs/                               # GitHub Pages source
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── files.json                      # Auto-generated
├── discord_sync.py                     # Sync script
├── requirements.txt
└── README.md
```

---

## 🚀 Setup Instructions

### Step 1: Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → Give it a name → Create
3. Go to the **"Bot"** tab in the left sidebar
4. Click **"Reset Token"** and copy your **Bot Token** (save it securely!)
5. Under **"Privileged Gateway Intents"**:
   - Enable **"Message Content Intent"** (required to read message attachments)
6. Go to **"OAuth2"** → **"URL Generator"**:
   - Select scope: `bot`
   - Select permissions: `Read Messages/View Channels`, `Read Message History`
   - Copy the generated URL and open it to invite the bot to your server

### Step 2: Get Channel ID

1. In Discord, go to **User Settings** → **Advanced** → Enable **"Developer Mode"**
2. Right-click on your target channel (e.g., `#website-uploads`)
3. Click **"Copy Channel ID"**

### Step 3: Set Up GitHub Repository

1. Create a new GitHub repository (or use existing)
2. Push these files to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 4: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:
   - Name: `DISCORD_BOT_TOKEN`
   - Value: Your bot token from Step 1
4. Add another secret:
   - Name: `DISCORD_CHANNEL_ID`
   - Value: Your channel ID from Step 2

### Step 5: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **"Source"**, select:
   - **Branch**: `main`
   - **Folder**: `/docs`
3. Click **Save**
4. Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Step 6: Test the Workflow

1. Go to the **Actions** tab in your repository
2. Select **"Update Files from Discord"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for it to complete (should take ~30 seconds)
5. Check if `docs/files.json` was updated

---

## ⚙️ Configuration

### Sync Frequency

The workflow runs every 15 minutes by default. To change this, edit `.github/workflows/update-files.yml`:

```yaml
schedule:
  - cron: '*/15 * * * *'  # Every 15 minutes
  # - cron: '*/30 * * * *'  # Every 30 minutes
  # - cron: '0 * * * *'     # Every hour
```

### Message Limit

By default, the script fetches the last 100 messages. To change this, edit `discord_sync.py`:

```python
messages = fetch_messages(token, channel_id, limit=100)  # Change 100 to desired number
```

---

## 🔒 Safety Notes

This implementation is designed to be **safe for GitHub Actions**:

| ✅ Safe Pattern | ❌ Avoided Pattern |
|----------------|-------------------|
| HTTP REST API calls | Discord Gateway connection |
| Short-lived process | Long-running bot |
| Exits after sync | Infinite event loop |
| ~30 second runtime | Bot that never exits |

The workflow includes:
- `timeout-minutes: 5` - Hard limit on job duration
- Concurrency controls to prevent overlapping runs
- `[skip ci]` in commit message to prevent recursive triggers

---

## 🧪 Local Testing

Test the sync script locally:

```bash
# Set environment variables
# Windows (PowerShell)
$env:DISCORD_BOT_TOKEN = "your_token_here"
$env:DISCORD_CHANNEL_ID = "your_channel_id"

# Windows (CMD)
set DISCORD_BOT_TOKEN=your_token_here
set DISCORD_CHANNEL_ID=your_channel_id

# Linux/Mac
export DISCORD_BOT_TOKEN="your_token_here"
export DISCORD_CHANNEL_ID="your_channel_id"

# Install dependencies
pip install -r requirements.txt

# Run the script
python discord_sync.py
```

---

## 🐛 Troubleshooting

### Bot gets 401 Unauthorized
- Check that your bot token is correct
- Make sure the token hasn't been regenerated

### Bot gets 403 Forbidden
- Ensure the bot has been invited to the server
- Check that the bot has permission to read the channel

### Files don't appear on the website
- Verify GitHub Pages is enabled and serving from `/docs`
- Check the Actions tab for any workflow errors
- Ensure the workflow has run at least once after files were uploaded

### Website shows old data
- The site caches `files.json` - give it a few minutes
- Force refresh with `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

---

## 📄 License

MIT License - feel free to use and modify!
