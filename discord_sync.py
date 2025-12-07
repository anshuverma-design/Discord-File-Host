#!/usr/bin/env python3
"""
Discord File Sync Script

Fetches attachments from a Discord channel via REST API and writes them to files.json.
This script is designed for short-lived execution (GitHub Actions / cron).

NO Gateway connection, NO long-running process, NO infinite loops.
"""

import os
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not installed. Run: pip install requests")
    sys.exit(1)


def get_env_vars():
    """Get required environment variables."""
    token = os.environ.get("DISCORD_BOT_TOKEN")
    channel_id = os.environ.get("DISCORD_CHANNEL_ID")
    
    if not token:
        print("ERROR: DISCORD_BOT_TOKEN environment variable not set")
        sys.exit(1)
    if not channel_id:
        print("ERROR: DISCORD_CHANNEL_ID environment variable not set")
        sys.exit(1)
    
    return token, channel_id


def fetch_messages(token: str, channel_id: str, limit: int = 100) -> list:
    """
    Fetch messages from a Discord channel using REST API.
    
    Args:
        token: Discord bot token
        channel_id: Target channel ID
        limit: Max messages to fetch (1-100)
    
    Returns:
        List of message objects
    """
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json"
    }
    params = {"limit": min(limit, 100)}
    
    print(f"Fetching up to {limit} messages from channel {channel_id}...")
    
    response = requests.get(url, headers=headers, params=params, timeout=30)
    
    if response.status_code == 200:
        messages = response.json()
        print(f"Successfully fetched {len(messages)} messages")
        return messages
    elif response.status_code == 401:
        print("ERROR: Invalid bot token (401 Unauthorized)")
        sys.exit(1)
    elif response.status_code == 403:
        print("ERROR: Bot lacks permission to read this channel (403 Forbidden)")
        sys.exit(1)
    elif response.status_code == 404:
        print("ERROR: Channel not found (404 Not Found)")
        sys.exit(1)
    else:
        print(f"ERROR: Discord API returned status {response.status_code}")
        print(f"Response: {response.text}")
        sys.exit(1)


def extract_attachments(messages: list) -> list:
    """
    Extract file attachments from messages.
    
    Args:
        messages: List of Discord message objects
    
    Returns:
        List of attachment info dicts
    """
    attachments = []
    
    for msg in messages:
        if not msg.get("attachments"):
            continue
        
        # Get author info
        author = msg.get("author", {})
        author_name = author.get("global_name") or author.get("username") or "Unknown"
        
        # Parse timestamp
        timestamp = msg.get("timestamp", "")
        
        for attachment in msg["attachments"]:
            file_info = {
                "name": attachment.get("filename", "unknown"),
                "url": attachment.get("url", ""),
                "uploaded_at": timestamp,
                "author": author_name,
                "size": attachment.get("size", 0),
                "content_type": attachment.get("content_type", "")
            }
            attachments.append(file_info)
    
    print(f"Extracted {len(attachments)} attachments")
    return attachments


def sort_attachments(attachments: list) -> list:
    """Sort attachments by upload time (newest first)."""
    def parse_timestamp(item):
        try:
            # Discord timestamps are ISO 8601 format
            ts = item.get("uploaded_at", "")
            if ts:
                # Handle both with and without microseconds
                if "." in ts:
                    return datetime.fromisoformat(ts.replace("Z", "+00:00"))
                else:
                    return datetime.fromisoformat(ts.replace("Z", "+00:00"))
            return datetime.min
        except (ValueError, TypeError):
            return datetime.min
    
    return sorted(attachments, key=parse_timestamp, reverse=True)


def write_json(attachments: list, output_path: Path):
    """
    Write attachments to JSON file with stable formatting.
    
    Args:
        attachments: List of attachment dicts
        output_path: Path to output JSON file
    """
    # Ensure parent directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write with stable formatting (sorted keys, indentation)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(attachments, f, indent=2, ensure_ascii=False, sort_keys=False)
    
    print(f"Wrote {len(attachments)} entries to {output_path}")


def main():
    """Main entry point."""
    print("=" * 50)
    print("Discord File Sync Script")
    print("=" * 50)
    
    # Get credentials
    token, channel_id = get_env_vars()
    
    # Determine output path (relative to script or repo root)
    script_dir = Path(__file__).parent
    output_path = script_dir / "docs" / "files.json"
    
    # Fetch messages from Discord
    messages = fetch_messages(token, channel_id, limit=100)
    
    # Extract attachments
    attachments = extract_attachments(messages)
    
    # Sort by newest first
    attachments = sort_attachments(attachments)
    
    # Write to JSON
    write_json(attachments, output_path)
    
    print("=" * 50)
    print("Sync complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()
