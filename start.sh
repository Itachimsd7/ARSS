#!/bin/bash

# Create MongoDB data directory if it doesn't exist
mkdir -p /tmp/mongodb-data
mkdir -p /tmp/mongodb-logs

# Start MongoDB in the background if not already running
if ! pgrep -x "mongod" > /dev/null
then
    mongod --dbpath /tmp/mongodb-data --logpath /tmp/mongodb-logs/mongod.log --fork --port 27017 2>&1
    echo "MongoDB started"
else
    echo "MongoDB is already running"
fi

# Detect environment and start accordingly
if [ "$NODE_ENV" = "production" ]; then
    echo "Running in PRODUCTION mode..."
    
    # Ensure client build exists
    if [ ! -d "client/dist" ]; then
        echo "Building client assets..."
        npm run build:client
    fi
    
    # Start Node.js backend in foreground
    cd server
    npm start
else
    echo "Running in DEVELOPMENT mode..."
    
    # Start backend in the background (dev mode)
    cd server
    npm run dev &
    echo "Backend development server started"
    
    # Start frontend in the foreground (Vite dev server)
    cd ../client
    npm run dev
fi

