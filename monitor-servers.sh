#!/bin/bash

PROJECT_DIR="/Users/shaunducker/Desktop/BookMate-application"

echo "🔍 Server Monitoring Started"
echo "Checking servers every 30 seconds..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    # Check if LAN server is running
    if ! pgrep -f "expo start --lan.*8081" > /dev/null; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') ⚠️  LAN server down, restarting..."
        cd "$PROJECT_DIR"
        nohup npx expo start --lan --port 8081 > lan-server.log 2>&1 &
        echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ LAN server restarted (PID $!)"
    fi
    
    # Check if tunnel primary is running
    if ! pgrep -f "expo start --tunnel.*8082" > /dev/null; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') ⚠️  Tunnel primary down, restarting..."
        cd "$PROJECT_DIR"
        nohup npx expo start --tunnel --port 8082 > tunnel-primary.log 2>&1 &
        echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ Tunnel primary restarted (PID $!)"
    fi
    
    # Check if tunnel backup is running
    if ! pgrep -f "expo start --tunnel.*8083" > /dev/null; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') ⚠️  Tunnel backup down, restarting..."
        cd "$PROJECT_DIR"
        nohup npx expo start --tunnel --port 8083 > tunnel-backup.log 2>&1 &
        echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ Tunnel backup restarted (PID $!)"
    fi
    
    # Wait 30 seconds before checking again
    sleep 30
done
