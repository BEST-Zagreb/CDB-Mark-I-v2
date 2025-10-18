#!/bin/bash

# Helper script to run Drizzle migrations with .env.local environment variables
# Usage: ./db/scripts/run-migration.sh [command]
# Commands: generate, push, studio
# Example: ./db/scripts/run-migration.sh push

set -e

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v "^#" | xargs)
else
  echo "❌ Error: .env.local file not found"
  exit 1
fi

COMMAND=${1:-push}

case $COMMAND in
  generate)
    echo "📝 Generating migration..."
    pnpm drizzle-kit generate
    ;;
  push)
    echo "🚀 Applying migrations..."
    pnpm drizzle-kit push
    ;;
  studio)
    echo "🎨 Opening Drizzle Studio..."
    pnpm drizzle-kit studio
    ;;
  *)
    echo "❌ Unknown command: $COMMAND"
    echo "Available commands: generate, push, studio"
    exit 1
    ;;
esac
