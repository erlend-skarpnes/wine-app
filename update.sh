#!/usr/bin/env bash
set -e

docker compose build server client
docker compose stop server client
docker compose up -d server client
