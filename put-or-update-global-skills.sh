
echo '========= COPILOT =============='
mkdir ~/.copilot/
cp -r ./skills/* ~/.copilot/skills/
cp -r ./skills/setup-kotlin-spring/claude/skills/* ~/.copilot/skills/
echo '========= COPILOT Copied ======='

echo '========= CODEX =============='
mkdir ~/.codex/
cp -r ./skills/* ~/.codex/skills/
cp -r ./skills/setup-kotlin-spring/claude/skills/* ~/.codex/skills/
echo '========= COPILOT Copied ======='

echo '========= COPILOT skills =============='
ls -la ~/.copilot/skills

echo '========= CODEX skills =============='
ls -la ~/.codex/skills