#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${RED}Error: Working directory has uncommitted changes${NC}"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Prompt for version bump type
echo ""
echo "Select version bump type:"
echo "  1) patch (bug fixes)"
echo "  2) minor (new features)"
echo "  3) major (breaking changes)"
echo "  4) custom"
read -p "Choice [1]: " CHOICE
CHOICE=${CHOICE:-1}

case $CHOICE in
  1) BUMP="patch" ;;
  2) BUMP="minor" ;;
  3) BUMP="major" ;;
  4)
    read -p "Enter custom version: " NEW_VERSION
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

# Calculate new version
if [ -z "$NEW_VERSION" ]; then
  NEW_VERSION=$(npx semver "$CURRENT_VERSION" -i "$BUMP")
fi

echo -e "New version: ${GREEN}$NEW_VERSION${NC}"
read -p "Continue? [Y/n]: " CONFIRM
CONFIRM=${CONFIRM:-Y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted"
  exit 0
fi

# Update package.json version
npm version "$NEW_VERSION" --no-git-tag-version

# Generate changelog entry
CHANGELOG_FILE="CHANGELOG.md"
DATE=$(date +%Y-%m-%d)

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  COMMITS=$(git log --pretty=format:"- %s" HEAD)
else
  COMMITS=$(git log --pretty=format:"- %s" "$LAST_TAG"..HEAD)
fi

# Create/update changelog
if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "# Changelog" > "$CHANGELOG_FILE"
  echo "" >> "$CHANGELOG_FILE"
fi

# Prepend new version to changelog
TEMP_FILE=$(mktemp)
echo "# Changelog" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "## [$NEW_VERSION] - $DATE" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "$COMMITS" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
tail -n +3 "$CHANGELOG_FILE" >> "$TEMP_FILE" 2>/dev/null || true
mv "$TEMP_FILE" "$CHANGELOG_FILE"

echo -e "${GREEN}Updated CHANGELOG.md${NC}"

# Commit and tag
git add package.json "$CHANGELOG_FILE"
git commit -m "chore: release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "v$NEW_VERSION"

echo ""
echo -e "${GREEN}Created commit and tag v$NEW_VERSION${NC}"
echo ""
echo "To publish, run:"
echo -e "  ${YELLOW}git push && git push --tags${NC}"
