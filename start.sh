#!/usr/bin/env bash
# Menjalankan backend (:4000) dan frontend (:5173) di background.
# Log: .run/be.log dan .run/fe.log. Hentikan dengan: bash stop.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.run"
BE_PORT=4000
FE_PORT=5173

mkdir -p "$RUN_DIR"

if [ ! -f "$ROOT/be/.env" ]; then
  echo "be/.env belum ada. Jalankan: cp be/.env.example be/.env lalu isi DATABASE_URL dan JWT_SECRET." >&2
  exit 1
fi

# Matikan instance lama dulu supaya port tidak bentrok.
bash "$ROOT/stop.sh" >/dev/null

for dir in be fe; do
  if [ ! -d "$ROOT/$dir/node_modules" ]; then
    echo "Memasang dependency $dir ..."
    (cd "$ROOT/$dir" && npm install)
  fi
done

start() {
  local name="$1" dir="$2"
  (cd "$ROOT/$dir" && nohup npm run dev >"$RUN_DIR/$name.log" 2>&1 & echo $! >"$RUN_DIR/$name.pid")
}

wait_port() {
  local name="$1" port="$2"
  for _ in $(seq 1 30); do
    if lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$name berjalan di port $port"
      return 0
    fi
    sleep 1
  done
  echo "$name belum aktif setelah 30 detik. Cek log: $RUN_DIR/$name.log" >&2
  return 1
}

start be be
start fe fe
wait_port "Backend " "$BE_PORT"
wait_port "Frontend" "$FE_PORT"

echo
echo "Buka http://localhost:$FE_PORT"
echo "Log: tail -f .run/be.log .run/fe.log"
