#!/bin/bash
echo "Cleaning up dangling development processes..."

# Kill running processes that match the project's dev commands
pkill -f "turbo run dev" || true
pkill -f "vite" || true
pkill -f "next" || true

# Kill processes taking up our specific ports to be absolutely sure
echo "Killing apps on ports 3000, 3001, and 4000..."
npx --yes kill-port 3000 3001 4000

echo "Cleanup complete! You can now start 'pnpm dev' again."
