#!/bin/bash

# Create MongoDB data directory if it doesn't exist
mkdir -p /tmp/mongodb-data
mkdir -p /tmp/mongodb-logs

# Start MongoDB in the background
mongod --dbpath /tmp/mongodb-data --logpath /tmp/mongodb-logs/mongod.log --fork --port 27017 2>&1
echo "MongoDB started"

# Start the Node.js backend in the background
cd /home/runner/workspace/server && node index.js &
echo "Backend started on port 5001"

# Start the React frontend
cd /home/runner/workspace/client && npm run dev
