#!/bin/bash
# Corrected command to launch Grok with Composer 2.5 model resuming the specific session
# Includes --restore-code to checkout the session's git state if applicable
# Run in your terminal: bash ~/Desktop/launch-composer-resume.sh

set -e

SESSION_ID="019e7fd8-04ab-7851-9c52-689315596188"
MODEL="grok-composer-2.5-fast"

echo "=== Launching Grok TUI ==="
echo "Model: $MODEL"
echo "Resuming session: $SESSION_ID"
echo "This loads the full history, TODOs, file edits, and context from your grokbuildcompare curation work."
echo "Using --restore-code to restore any associated git commit state from the session."

grok -m "$MODEL" -r "$SESSION_ID" --restore-code

# If the above doesn't work in your shell, use long flags:
# grok --model "$MODEL" --resume "$SESSION_ID" --restore-code
