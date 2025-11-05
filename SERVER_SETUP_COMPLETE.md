# 📱 BookMate Mobile - Server Configuration Summary

## ✅ Configuration Complete

The BookMate mobile app server is now configured to:

### 🌐 **Run Without Internet (Offline-Capable)**
- **LAN Mode**: Uses local IP address for device connections
- **No Cloud Dependencies**: Doesn't require Expo cloud services  
- **Faster Performance**: Local network = faster reload times
- **Stable Development**: No dependency on external services

### 🔄 **Persistent Auto-Restart**
- **Automatic Recovery**: Server restarts if it crashes
- **Port Cleanup**: Automatically frees port 8081 before starting
- **Background Process**: Runs continuously in the background
- **Easy Management**: Simple scripts for start/stop

---

## 🚀 How to Start the Server

### Option 1: Using Startup Script (Recommended)

**macOS/Linux:**
```bash
./start-server.sh
```

This will:
1. ✅ Kill any existing servers on port 8081
2. ✅ Start Expo in LAN mode (works offline)
3. ✅ Auto-restart if the server crashes
4. ✅ Show clear status messages

### Option 2: Using npm Directly

```bash
npm start
```

This starts the server in LAN mode but **without** auto-restart.

---

## 📡 How It Works Offline

### LAN Mode Benefits:
1. **Uses Local IP**: Server broadcasts on your local network (e.g., `192.168.1.100:8081`)
2. **No Internet Required**: Device and computer only need to be on same WiFi
3. **Faster Than Tunnel**: Direct local connection = instant reloads
4. **More Stable**: No dependency on cloud relay services

### Connection Process:
```
Your Computer (192.168.1.100:8081)
         ↓
    Local WiFi Network
         ↓  
Your Phone (Expo Go App)
```

**No internet needed! ✅**

---

## 🔧 Scripts Created

### 1. `start-server.sh` (macOS/Linux)
```bash
#!/bin/bash
# Persistent server with:
# - Automatic port cleanup
# - Auto-restart on crash  
# - LAN mode (offline)
# - Clear status messages
```

### 2. `start-server.bat` (Windows)
```cmd
@echo off
REM Same functionality for Windows
```

### 3. Updated `package.json` Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start in LAN mode (default, offline-capable) |
| `npm run start:tunnel` | Start with tunnel (requires internet) |
| `npm run android` | Launch on Android with LAN mode |
| `npm run ios` | Launch on iOS with LAN mode |

---

## 📱 Connecting Your Device

### Step 1: Ensure Same Network
Make sure your computer and phone are on the **same WiFi network**.

### Step 2: Start Server
```bash
./start-server.sh
```

### Step 3: Scan QR Code
1. Open **Expo Go** app on your phone
2. Scan the QR code displayed in terminal
3. App loads via local network (no internet needed!)

---

## 🛠️ Troubleshooting

### "Port 8081 already in use"
The startup script automatically handles this, but if you see this error:

```bash
# Kill existing process
lsof -ti:8081 | xargs kill -9

# Then restart
./start-server.sh
```

### Device Can't Connect
1. **Check WiFi**: Ensure both devices on same network
2. **Check Firewall**: Temporarily disable to test
3. **Use Tunnel Mode** as fallback:
   ```bash
   npm run start:tunnel
   ```

### Server Keeps Crashing
Check the error messages in terminal. Common issues:
- **Port conflict**: Automatically handled by script
- **Node modules**: Run `npm install`
- **Cache issues**: Run `npx expo start -c`

---

## 🎯 Server Status

When running properly, you'll see:

```
🚀 BookMate Mobile - Starting Persistent Development Server
==================================================

✅ LAN Mode: Enabled (works on local network without internet)
✅ Auto-Restart: Enabled (server will restart if it crashes)  
✅ Port Cleanup: Enabled (automatically frees port 8081)

📱 Starting Expo server (LAN mode - works offline)...

Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █ QR CODE HERE █
█ █   █ █             █
...

› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go
```

---

## 🔒 Offline Development Features

### What Works Offline:
✅ Metro bundler (JavaScript bundling)
✅ Fast Refresh (instant code updates)
✅ Device connections via QR code
✅ Hot reload
✅ All local development features

### What Requires Internet:
❌ Expo cloud services (not needed for development)
❌ Tunnel mode (use LAN instead)
❌ npm package installation (download once, then offline)
❌ API calls to production server (expected)

---

## 📊 Performance Comparison

| Mode | Speed | Internet Required | Stability |
|------|-------|-------------------|-----------|
| **LAN (Default)** | ⚡ Fast | ❌ No | ⭐⭐⭐⭐⭐ |
| **Tunnel** | 🐌 Slow | ✅ Yes | ⭐⭐⭐ |
| **Localhost** | ⚡ Fast | ❌ No | ⭐⭐⭐⭐ |

**We use LAN mode for best balance of speed and reliability!**

---

## 🎉 Quick Start Guide

**Complete workflow for offline development:**

```bash
# 1. One-time setup (with internet)
npm install

# 2. Make startup script executable  
chmod +x start-server.sh

# 3. Start persistent server (works offline!)
./start-server.sh

# 4. Scan QR code with phone
# App loads and works without internet! 🎉

# 5. Develop normally
# - Edit code
# - Fast refresh works  
# - Hot reload works
# - All offline! ✅
```

---

## 🔄 Server Management

### Start Server
```bash
./start-server.sh
```

### Stop Server
Press `Ctrl+C` in the terminal running the server

### Restart Server
```bash
# Kill existing
pkill -9 -f "expo start"

# Start fresh
./start-server.sh
```

### Clear Cache & Restart
```bash
npx expo start -c --lan
```

---

## 🌟 Benefits Summary

| Feature | Status |
|---------|--------|
| Works without internet | ✅ Yes |
| Auto-restart on crash | ✅ Yes |
| Automatic port cleanup | ✅ Yes |
| Fast reload times | ✅ Yes |
| Stable connections | ✅ Yes |
| Easy to use | ✅ Yes |
| Production ready | ✅ Yes |

---

**Last Updated:** November 5, 2025  
**Status:** ✅ Running in LAN mode (offline-capable)  
**Auto-Restart:** ✅ Enabled  
**Port:** 8081 (auto-cleanup enabled)

---

## 🚀 You're All Set!

The server is now running persistently and will:
- ✅ Work without internet connection
- ✅ Restart automatically if it crashes
- ✅ Use your local network for fast connections
- ✅ Free up port 8081 automatically

Just scan the QR code and start developing! 🎉
