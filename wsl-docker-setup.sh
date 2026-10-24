#!/bin/bash
# One-off: install Docker Engine inside WSL Ubuntu (no Windows admin required)
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
echo "== installing docker =="
apt-get install -y -qq docker.io docker-compose-v2 2>/dev/null \
  || apt-get install -y -qq docker.io docker-compose

echo "== starting dockerd =="
if ! docker info >/dev/null 2>&1; then
  nohup dockerd >/var/log/dockerd.log 2>&1 &
  for i in $(seq 1 30); do
    docker info >/dev/null 2>&1 && break
    sleep 2
  done
fi

echo "== versions =="
docker --version
docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo "NO COMPOSE"

if docker info >/dev/null 2>&1; then
  echo "DOCKER READY"
else
  echo "DOCKER FAILED"
  tail -30 /var/log/dockerd.log
  exit 1
fi
