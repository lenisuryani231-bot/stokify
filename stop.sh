#!/usr/bin/env bash
# Menghentikan backend dan frontend yang dijalankan oleh start.sh.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.run"
PORTS=(4000 5173)

kill_tree() {
  local pid="$1"
  # Matikan anak proses (node di bawah npm) lalu proses induknya.
  pkill -TERM -P "$pid" 2>/dev/null || true
  kill -TERM "$pid" 2>/dev/null || true
}

for name in be fe; do
  pidfile="$RUN_DIR/$name.pid"
  if [ -f "$pidfile" ]; then
    kill_tree "$(cat "$pidfile")"
    rm -f "$pidfile"
  fi
done

# Jaga-jaga: bebaskan port jika masih ada proses yang tersisa.
for port in "${PORTS[@]}"; do
  pids="$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill -TERM $pids 2>/dev/null || true
  fi
done

sleep 1
for port in "${PORTS[@]}"; do
  if lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port masih dipakai, memaksa berhenti"
    lsof -ti "tcp:$port" -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
  fi
done

echo "Backend dan frontend dihentikan."
