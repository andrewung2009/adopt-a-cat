#!/bin/bash
eval $(ssh-agent -s)
ssh-add /home/user/.ssh/id_rsa 2>/dev/null || true
ssh -T git@github.com 2>&1 || echo "SSH not working"
