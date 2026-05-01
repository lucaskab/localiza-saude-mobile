#!/usr/bin/env sh
set -eu

FLOW_GROUP="${1:-provider}"
APP_ID="${APP_ID:-com.llf.localizasaude}"
FLOW_DIR=".maestro/flows/${FLOW_GROUP}"

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

disable_ios_expo_dev_menu() {
	if ! command -v xcrun >/dev/null 2>&1; then
		return 0
	fi

	if ! xcrun simctl list devices booted | grep -q "(Booted)"; then
		return 0
	fi

	xcrun simctl spawn booted defaults write "$APP_ID" EXDevMenuShowFloatingActionButton -bool false >/dev/null 2>&1 || true
	xcrun simctl spawn booted defaults write "$APP_ID" EXDevMenuShowsAtLaunch -bool false >/dev/null 2>&1 || true
	xcrun simctl spawn booted defaults write "$APP_ID" EXDevMenuIsOnboardingFinished -bool true >/dev/null 2>&1 || true
	xcrun simctl spawn booted defaults write "$APP_ID" EXDevMenuTouchGestureEnabled -bool false >/dev/null 2>&1 || true
	xcrun simctl spawn booted defaults write "$APP_ID" EXDevMenuMotionGestureEnabled -bool false >/dev/null 2>&1 || true
	xcrun simctl terminate booted "$APP_ID" >/dev/null 2>&1 || true
}

disable_ios_expo_dev_menu

maestro test -e APP_ID="$APP_ID" "$FLOW_DIR"
