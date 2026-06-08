#!/bin/bash
# Use this to launch with explicit full path to grok bin, force Composer 2.5, resume the session
# Run: bash ~/Desktop/launch-composer-resume-fullpath.sh

set -e

GROK_BIN=~/.grok/bin/grok
MODEL=grok-composer-2.5-fast
SESSION=019e7fd8-04ab-7851-9c52-689315596188

echo "Using grok binary: $GROK_BIN"
echo "Model: $MODEL"
echo "Resuming session: $SESSION"
echo "This will start the TUI on Composer 2.5 with all your previous grokbuildcompare work and context."

exec "$GROK_BIN" -m "$MODEL" --resume "$SESSION"

# Alternative one-liner to run directly:
# ~/.grok/bin/grok -m grok-composer-2.5-fast --resume 019e7fd8-04ab-7851-9c52-689315596188
