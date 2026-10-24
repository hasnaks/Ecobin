#!/bin/bash
# Launch the EcoBin container stack fully detached inside WSL.
# setsid gives the build its own session so it survives wsl.exe exit.
cd /mnt/d/ecobin || { echo "project not found"; exit 1; }
setsid nohup docker compose up --build -d > /tmp/ecobin-compose.log 2>&1 < /dev/null &
sleep 3
if [ -f /tmp/ecobin-compose.log ]; then
  echo "BUILD RUNNING, first log lines:"
  head -5 /tmp/ecobin-compose.log
else
  echo "ERROR: log file was not created"
  exit 1
fi
