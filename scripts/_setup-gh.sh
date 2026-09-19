#!/bin/bash
# Install gh CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list 2>/dev/null
sudo apt-get update -qq 2>/dev/null
sudo apt-get install gh -y -qq 2>/dev/null
gh auth login --with-token <<< "" 2>/dev/null || true
echo "gh installed"
