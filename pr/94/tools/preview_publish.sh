#!/bin/bash
# Publish this checkout to nfstride1-ux/scoretool-lab under pr/<number>/.
# DEPLOY_KEY is a write deploy key for scoretool-lab. It is not printed.
set -euo pipefail
if [ -z "${DEPLOY_KEY:-}" ] || [ -z "${PR_NUMBER:-}" ]; then
  echo "DEPLOY_KEY and PR_NUMBER are required"
  exit 1
fi
umask 077
keyfile=$(mktemp)
workdir=$(mktemp -d)
cleanup() { rm -f "$keyfile"; rm -rf "$workdir"; }
trap cleanup EXIT
printf '%s\n' "$DEPLOY_KEY" > "$keyfile"
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
ssh-keyscan -t ed25519,rsa github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null
export GIT_SSH_COMMAND="ssh -i $keyfile -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes"
git clone --depth 1 git@github.com:nfstride1-ux/scoretool-lab.git "$workdir/lab"
python3 tools/preview_export.py "$workdir/lab/pr/$PR_NUMBER"
git -C "$workdir/lab" add "pr/$PR_NUMBER"
if git -C "$workdir/lab" diff --cached --quiet; then
  echo "Preview folder already matches this commit."
  exit 0
fi
git -C "$workdir/lab" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" -c user.name="github-actions[bot]" \
  commit -m "Preview pull request #${PR_NUMBER}"
git -C "$workdir/lab" pull --rebase origin main
git -C "$workdir/lab" push origin HEAD:main
echo "Pushed pr/${PR_NUMBER} to scoretool-lab."
