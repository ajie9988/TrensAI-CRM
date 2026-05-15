#!/bin/bash

# Clean up Docker resources

set -e

echo "🧹 Cleaning up Docker resources..."

echo "  Removing unused images..."
docker image prune -f

echo "  Removing unused volumes..."
docker volume prune -f

echo "  Removing unused networks..."
docker network prune -f

echo "✅ Cleanup complete!"
