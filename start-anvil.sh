#!/bin/bash
# Start Anvil and restore the saved chain state (contract already deployed)
# Usage:
#   ./start-anvil.sh          → foreground (Ctrl+C to stop, state saved on exit)
#   ./start-anvil.sh --bg     → background (logs at /tmp/anvil.log)
#   ./start-anvil.sh --stop   → kill running Anvil

STATE_FILE="/media/newvolume/Hackathons/Mrph/anvil-state.json"

if [ "$1" = "--stop" ]; then
  pkill anvil && echo "🛑 Anvil stopped" || echo "Anvil was not running"
  exit 0
fi

pkill anvil 2>/dev/null
sleep 1

ANVIL_CMD="anvil --load-state $STATE_FILE --dump-state $STATE_FILE --host 0.0.0.0"

if [ ! -f "$STATE_FILE" ]; then
  echo "⚠️  No state file — starting fresh and deploying contract..."
  anvil --dump-state "$STATE_FILE" --host 0.0.0.0 &
  sleep 3
  cd /media/newvolume/Hackathons/Mrph/contracts
  forge script script/Deploy.s.sol \
    --rpc-url http://127.0.0.1:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --silent
  echo "✅ Contract deployed."
  ANVIL_CMD="anvil --dump-state $STATE_FILE --host 0.0.0.0"
fi

if [ "$1" = "--bg" ]; then
  nohup $ANVIL_CMD > /tmp/anvil.log 2>&1 &
  sleep 2
  cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://127.0.0.1:8545 | grep -q "0x60" \
    && echo "✅ Anvil running in background (PID $!). Contract live. Logs: /tmp/anvil.log" \
    || echo "⚠️  Anvil started but contract not found — check /tmp/anvil.log"
else
  echo "📦 Loading chain state... (Ctrl+C to stop and save state)"
  $ANVIL_CMD
fi
