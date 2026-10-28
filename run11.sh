while pgrep -f "codex exec.*TASK11 " >/dev/null || pgrep -f "TASK11 — 時境" >/dev/null; do sleep 20; done
codex exec -s workspace-write -c sandbox_workspace_write.network_access=true --skip-git-repo-check -C /workspace/history-map "$(cat TASK11b.md)" > codex11b.log 2>&1
