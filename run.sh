#!/usr/bin/env bash
# ==============================================================================
# KOINEXA Quick Launch Script (Linux / macOS)
# One-click startup for Koinexa Full-Stack Educational Platform
# Starts:
#   - Flask REST API Backend (Port 5001)
#   - Vite + React Frontend Client (Port 5174)
# Features:
#   - Auto-detects local Node.js (.node/bin) & Python3
#   - Automatic stale port cleanup (5001, 5174)
#   - Health checks and live readiness confirmation
#   - Graceful shutdown on Ctrl+C (no zombie processes)
# ==============================================================================

# ANSI Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine script root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

clear 2>/dev/null || true

echo -e "${CYAN}${BOLD}"
echo "  ██╗  ██╗ ██████╗ ██╗███╗   ██╗███████╗██╗  ██╗ █████╗ "
echo "  ██║ ██╔╝██╔═══██╗██║████╗  ██║██╔════╝╚██╗██╔╝██╔══██╗"
echo "  █████╔╝ ██║   ██║██║██╔██╗ ██║█████╗   ╚███╔╝ ███████║"
echo "  ██╔═██╗ ██║   ██║██║██║╚██╗██║██╔══╝   ██╔██╗ ██╔══██║"
echo "  ██║  ██╗╚██████╔╝██║██║ ╚████║███████╗██╔╝ ██╗██║  ██║"
echo "  ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${BLUE}${BOLD}  Educational Intelligence Platform - Quick Launcher${NC}"
echo -e "  Root: ${SCRIPT_DIR}"
echo -e "  ========================================================\n"

# ------------------------------------------------------------------------------
# 1. Environment & Dependency Discovery
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/5] Checking environment & runtime dependencies...${NC}"

# Check for local .node directory and add to PATH if present
if [ -d "$SCRIPT_DIR/.node/bin" ]; then
    export PATH="$SCRIPT_DIR/.node/bin:$PATH"
fi

# Detect Python 3
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}[ERROR] Python is not installed. Please install Python 3.10+.${NC}"
    exit 1
fi
PYTHON_VER=$($PYTHON_CMD --version 2>&1)
echo -e "  ${GREEN}✔${NC} Python Runtime : ${BOLD}${PYTHON_VER}${NC} (${PYTHON_CMD})"

# Detect Node.js
if command -v node &>/dev/null; then
    NODE_VER=$(node -v 2>&1)
    echo -e "  ${GREEN}✔${NC} Node.js Runtime: ${BOLD}${NODE_VER}${NC} ($(which node))"
else
    echo -e "${RED}[ERROR] Node.js is not found in PATH or in .node/bin.${NC}"
    echo -e "        Please install Node.js 18+ or run npm install.${NC}"
    exit 1
fi

# Detect npm
if command -v npm &>/dev/null; then
    NPM_VER=$(npm -v 2>&1)
    echo -e "  ${GREEN}✔${NC} NPM Package Mgr: ${BOLD}v${NPM_VER}${NC}"
else
    echo -e "${RED}[ERROR] npm is not found in PATH.${NC}"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. Freeing Busy Ports (5001 & 5174)
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[2/5] Checking port availability (5001, 5174)...${NC}"

kill_port() {
    local port=$1
    local name=$2
    if command -v fuser &>/dev/null; then
        if fuser -s "${port}/tcp" 2>/dev/null; then
            echo -e "  ${YELLOW}⚠ Port ${port} (${name}) is currently in use. Releasing...${NC}"
            fuser -k -9 "${port}/tcp" &>/dev/null || true
            sleep 0.5
        fi
    elif command -v lsof &>/dev/null; then
        local pids=$(lsof -ti:"${port}" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo -e "  ${YELLOW}⚠ Port ${port} (${name}) has active PID(s): ${pids}. Terminating...${NC}"
            echo "$pids" | xargs -r kill -9 2>/dev/null || true
            sleep 0.5
        fi
    fi
}

kill_port 5001 "Backend API"
kill_port 5174 "Frontend Vite"
echo -e "  ${GREEN}✔${NC} Ports 5001 & 5174 are ready and available."

# ------------------------------------------------------------------------------
# 3. Setup Logs Directory & Cleanup Traps
# ------------------------------------------------------------------------------
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"
BACKEND_LOG="$LOGS_DIR/backend.log"
FRONTEND_LOG="$LOGS_DIR/frontend.log"

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=0

cleanup() {
    if [ "$CLEANED_UP" -eq 1 ]; then
        return
    fi
    CLEANED_UP=1

    echo -e "\n\n${YELLOW}[!] Shutting down KOINEXA services...${NC}"
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "  -> Stopping Frontend (PID: $FRONTEND_PID)..."
        kill -SIGTERM "$FRONTEND_PID" 2>/dev/null || kill -SIGKILL "$FRONTEND_PID" 2>/dev/null
    fi
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "  -> Stopping Backend (PID: $BACKEND_PID)..."
        kill -SIGTERM "$BACKEND_PID" 2>/dev/null || kill -SIGKILL "$BACKEND_PID" 2>/dev/null
    fi

    # Final cleanup of any children listening on ports
    kill_port 5001 "Backend"
    kill_port 5174 "Frontend"

    echo -e "${GREEN}[✔] All KOINEXA services stopped cleanly. Have a great day!${NC}\n"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ------------------------------------------------------------------------------
# 4. Launching Backend & Frontend
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[3/5] Starting Koinexa Backend REST API [Port 5001]...${NC}"
# Launch Flask backend
export PYTHONUNBUFFERED=1
$PYTHON_CMD "$SCRIPT_DIR/backend/app.py" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo -e "  ${GREEN}✔${NC} Backend started in background (PID: ${BOLD}${BACKEND_PID}${NC})"
echo -e "      Log file: ${CYAN}${BACKEND_LOG}${NC}"

echo -e "\n${CYAN}[4/5] Starting Koinexa Frontend React UI [Port 5174]...${NC}"
# Launch Vite frontend
cd "$SCRIPT_DIR/frontend"
npm run dev -- --host --port 5174 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"
echo -e "  ${GREEN}✔${NC} Frontend started in background (PID: ${BOLD}${FRONTEND_PID}${NC})"
echo -e "      Log file: ${CYAN}${FRONTEND_LOG}${NC}"

# ------------------------------------------------------------------------------
# 5. Service Readiness Health Checks
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[5/5] Waiting for services to initialize...${NC}"

# Check backend availability
MAX_WAIT=20
WAIT_COUNT=0
BACKEND_UP=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        if command -v curl &>/dev/null; then
            if curl -s -m 1 http://127.0.0.1:5001/ &>/dev/null || curl -s -m 1 http://127.0.0.1:5001/api/health &>/dev/null; then
                BACKEND_UP=1
                break
            fi
        fi
    else
        echo -e "${RED}[ERROR] Backend process terminated unexpectedly! Check log:${NC}"
        tail -n 20 "$BACKEND_LOG"
        exit 1
    fi
    sleep 0.5
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

# Check frontend availability
WAIT_COUNT=0
FRONTEND_UP=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        if command -v curl &>/dev/null; then
            if curl -s -m 1 http://localhost:5174/ &>/dev/null; then
                FRONTEND_UP=1
                break
            fi
        fi
    else
        echo -e "${RED}[ERROR] Frontend process terminated unexpectedly! Check log:${NC}"
        tail -n 20 "$FRONTEND_LOG"
        exit 1
    fi
    sleep 0.5
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

# Detect Local IP address for mobile / LAN testing
LAN_IP="localhost"
if command -v hostname &>/dev/null; then
    HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -n "$HOST_IP" ]; then
        LAN_IP="$HOST_IP"
    fi
fi

echo -e "\n${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}   🚀  KOINEXA FULL-STACK PLATFORM IS LIVE & READY!                     ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "   ${BOLD}🌐 Frontend UI Client :${NC} ${CYAN}http://localhost:5174${NC}"
echo -e "   ${BOLD}📡 Backend REST API   :${NC} ${CYAN}http://127.0.0.1:5001${NC}"
echo -e "   ${BOLD}📱 Network / LAN URL  :${NC} ${CYAN}http://${LAN_IP}:5174${NC}"
echo -e "   --------------------------------------------------------------------"
echo -e "   ${BOLD}📝 Live Logs          :${NC} ${BLUE}tail -f logs/backend.log logs/frontend.log${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "   ${YELLOW}Press [Ctrl + C] anytime to gracefully stop all services.${NC}\n"

# Optionally auto-open browser if --open or -o flag is passed
if [[ "$*" == *"--open"* ]] || [[ "$*" == *"-o"* ]]; then
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:5174" &>/dev/null &
    fi
fi

# Wait and monitor processes
while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "\n${RED}[ERROR] Backend crashed. Last 15 lines of log:${NC}"
        tail -n 15 "$BACKEND_LOG"
        break
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "\n${RED}[ERROR] Frontend crashed. Last 15 lines of log:${NC}"
        tail -n 15 "$FRONTEND_LOG"
        break
    fi
    sleep 1
done
