# Power Automate Classic View Switcher

A Chrome Extension that switches Power Automate to the classic designer automatically or with one click. Perfect for developers who prefer the classic flow editor over the new v3 designer.

## Features

- **One-click switch** - Toggle between Classic and New Designer from the popup
- **Auto-switch mode** - Automatically redirects to the classic designer whenever you open a flow editor or view run history
- **Works on both domains** - Supports `make.powerautomate.com` and `flow.microsoft.com`
- **Smart detection** - Only activates on flow editor and run history pages

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the project folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to any Power Automate flow editor or run history page
2. Click the extension icon to see the current designer status
3. Click the button to switch between Classic and New Designer
4. Toggle **Auto-switch mode** to automatically use the classic designer on every flow page

## How It Works

The extension appends `?v3=false` to Power Automate flow URLs to force the classic designer view. In auto-switch mode, a background service worker monitors tab navigation and automatically redirects matching URLs.

## Supported URLs

- `https://make.powerautomate.com/.../flows/{flowId}`
- `https://flow.microsoft.com/.../flows/{flowId}`
- Flow run history: `.../flows/{flowId}/runs/{runId}`

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome Storage API for persisting settings

## License

MIT
