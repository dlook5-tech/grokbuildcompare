#!/bin/bash
# EASIEST ONE-COMMAND SWITCH TO COMPOSER 2.5 FAST + LAUNCH
# Run this from terminal: bash ~/Desktop/switch-to-composer-and-launch.sh [extra args like -c]

set -e

BACKUP_DIR=~/Desktop/grok-switch-backup/$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "=== Backing up current configs to $BACKUP_DIR ==="
cp ~/.grok/config.toml "$BACKUP_DIR/config.toml.bak" 2>/dev/null || true
cp ~/.grok/pager.toml "$BACKUP_DIR/pager.toml.bak" 2>/dev/null || true

echo "=== Applying Composer 2.5 as default (easiest route) ==="

cat > ~/.grok/config.toml << 'EOT'
[cli]
installer = "internal"

[ui]
max_thoughts_width = 120
fork_secondary_model = "grok-composer-2.5-fast"
yolo = false
compact_mode = false
permission_mode = "always-approve"

[models]
default = "grok-composer-2.5-fast"
EOT

cat > ~/.grok/pager.toml << 'EOT'
# Terminal and TUI appearance settings
[terminal]
alt_screen = "always"
EOT

echo "Configs updated for grok-composer-2.5-fast (default + fork)."
echo "alt_screen=always applied to fix bottom UI/input visibility."
echo "Backups saved in $BACKUP_DIR"

echo ""
echo "=== Launching Grok with explicit Composer 2.5 model ==="
echo "This is the easiest way - no typing inside TUI needed for switch."
echo "To continue your previous session (recommended to not lose context), the script passes args."
echo "Example: bash this-script.sh -c"
echo ""

exec grok -m grok-composer-2.5-fast "$@"
