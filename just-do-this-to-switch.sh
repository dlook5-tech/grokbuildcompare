# SUPER SHORT COPY-PASTE: Run this one command in your terminal
bash -c '
cat > ~/.grok/config.toml << "EOT"
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
cat > ~/.grok/pager.toml << "EOT"
[terminal]
alt_screen = "always"
EOT
echo "Switched to Composer 2.5 + bottom UI fix applied."
echo "Now run: grok -m grok-composer-2.5-fast"
echo "Or just: grok   (it will use the new default)"
'
