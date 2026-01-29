# rundev

Smart dev server launcher with environment switching.

## Features

- **Environment Switching**: Automatically copies environment files based on project patterns
- **Script Discovery**: Scans `package.json` for `dev*` scripts and prompts for selection
- **Last Script Memory**: Use `-l` flag to re-run the last selected script
- **Auto-detection**: Detects environment from `.env` `STAGE=` or `$AWS_PROFILE`

## Installation

```bash
# Clone and build
git clone https://github.com/71zone/rundev.git
cd rundev
pnpm install
pnpm build

# Link globally
npm link
```

## Usage

```bash
# Prompt for script selection with environment
rundev staging

# Use last selected script
rundev staging -l

# Auto-detect environment from .env or AWS_PROFILE
rundev
rundev -l
```

## Configuration

### Global Config: `~/.config/rundev/config.json`

```json
{
  "envDir": "~/.config/env",
  "globalEnvFile": "~/.config/env/global",
  "mappings": [
    {
      "pattern": "*/admin/web",
      "envPath": "admin/{env}"
    },
    {
      "pattern": "*/web",
      "envPath": "{env}"
    }
  ]
}
```

### Local Config (per-project): `.rundevrc.json`

```json
{
  "envPath": "custom/{env}",
  "scriptFilter": "dev*"
}
```

Local config overrides global mappings for that project.

## How It Works

1. Loads config (global + local override)
2. Detects or uses provided environment name
3. Copies `{envDir}/{envPath}` to `.env`, appending global env file if exists
4. Scans `package.json` for scripts matching filter (default: `dev*`)
5. Prompts for selection (or uses last with `-l`)
6. Runs the selected script

## License

MIT
