#!/bin/bash
# Run from /backend directory
echo "🌿 Starting Green Goals API..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
