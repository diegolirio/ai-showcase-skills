
echo '========= COPILOT =============='
mkdir -p ~/.copilot/skills/
cp -r ./skills/* ~/.copilot/skills/
cp -r ./skills/setup-kotlin-spring/claude/skills/* ~/.copilot/skills/
echo '========= COPILOT Copied ======='

echo '========= CODEX =============='
mkdir -p ~/.codex/skills/
cp -r ./skills/* ~/.codex/skills/
cp -r ./skills/setup-kotlin-spring/claude/skills/* ~/.codex/skills/
echo '========= CODEX Copied ======='

echo '========= CLAUDE =============='
mkdir -p ~/.claude/skills/
cp -r ./skills/* ~/.claude/skills/
cp -r ./skills/setup-kotlin-spring/claude/skills/* ~/.claude/skills/
echo '========= CLAUDE Copied ======='

echo '========= CURSOR =============='
mkdir -p ~/.cursor/skills/
cp -r ./skills/* ~/.cursor/skills/
cp -r ./skills/setup-kotlin-spring/claude/skills/* ~/.cursor/skills/
echo '========= CURSOR Copied ======='

echo '========= COPILOT skills =============='
ls -la ~/.copilot/skills

echo '========= CODEX skills =============='
ls -la ~/.codex/skills

echo '========= CLAUDE skills =============='
ls -la ~/.claude/skills

echo '========= CURSOR skills =============='
ls -la ~/.cursor/skills