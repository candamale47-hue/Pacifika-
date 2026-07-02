#!/bin/bash
# ============================================
# Pacifika Wear - One-Command Deploy Script
# Usage: ./deploy.sh [platform]
# Platforms: local (default), render, fly, dokku
# ============================================

set -e

PLATFORM="${1:-local}"
APP_NAME="pacifika-wear"

echo "=========================================="
echo "  Pacifika Wear - Deploy"
echo "  Platform: $PLATFORM"
echo "=========================================="

# ---- Pre-flight checks ----
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Install it first:"
    echo "  https://docs.docker.com/get-docker/"
    exit 1
fi

case "$PLATFORM" in

  # ---- Local Docker Compose ----
  local)
    echo "Building and starting locally..."
    docker-compose down 2>/dev/null || true
    docker-compose up --build -d
    echo ""
    echo "App is running at: http://localhost:3000"
    echo "Admin panel: http://localhost:3000/admin"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    ;;

  # ---- Render (https://render.com) ----
  render)
    echo "Deploying to Render..."
    if ! command -v render &> /dev/null; then
      echo "Install Render CLI: npm install -g @render/cli"
      echo "Or use the Render dashboard: https://dashboard.render.com"
      echo ""
      echo "Manual steps:"
      echo "  1. Create a new Web Service on Render"
      echo "  2. Connect your GitHub repo"
      echo "  3. Set build command: docker build -t pacifika-wear ."
      echo "  4. Set start command: docker run -p 3000:3000 pacifika-wear"
      echo "  5. Add disk: /app/db and /app/public/uploads"
      exit 0
    fi
    render deploy
    ;;

  # ---- Fly.io (https://fly.io) ----
  fly)
    echo "Deploying to Fly.io..."
    if ! command -v flyctl &> /dev/null; then
      echo "Install Fly CLI: curl -L https://fly.io/install.sh | sh"
      exit 1
    fi
    
    if [ ! -f "fly.toml" ]; then
      echo "Creating fly.toml..."
      cat > fly.toml << 'EOF'
app = 'pacifika-wear'
primary_region = 'syd'

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
  processes = ['app']

[[mounts]]
  source = 'pacifika_data'
  destination = '/app/db'

[[mounts]]
  source = 'pacifika_uploads'
  destination = '/app/public/uploads'
EOF
    fi
    
    flyctl launch --now --name "$APP_NAME" --region syd
    flyctl volumes create pacifika_data --region syd --size 1
    flyctl volumes create pacifika_uploads --region syd --size 1
    flyctl deploy
    echo ""
    echo "App deployed! Check: flyctl status"
    ;;

  # ---- Dokku (self-hosted) ----
  dokku)
    echo "Deploying to Dokku..."
    DOKKU_HOST="${2:-your-dokku-server.com}"
    
    # Create app if not exists
    ssh "dokku@$DOKKU_HOST" apps:create "$APP_NAME" 2>/dev/null || true
    
    # Add persistent storage
    ssh "dokku@$DOKKU_HOST" storage:mount "$APP_NAME" "/var/lib/dokku/data/storage/$APP_NAME/db:/app/db"
    ssh "dokku@$DOKKU_HOST" storage:mount "$APP_NAME" "/var/lib/dokku/data/storage/$APP_NAME/uploads:/app/public/uploads"
    
    # Deploy
    git remote add dokku "dokku@$DOKKU_HOST:$APP_NAME" 2>/dev/null || true
    git push dokku main
    ;;

  # ---- Generic VPS / Any Server ----
  vps)
    echo "Building for VPS deployment..."
    docker build -t "$APP_NAME:latest" .
    docker stop "$APP_NAME" 2>/dev/null || true
    docker rm "$APP_NAME" 2>/dev/null || true
    docker run -d \
      --name "$APP_NAME" \
      --restart unless-stopped \
      -p 3000:3000 \
      -v "$(pwd)/db:/app/db" \
      -v "$(pwd)/public/uploads:/app/public/uploads" \
      -e NODE_ENV=production \
      "$APP_NAME:latest"
    echo ""
    echo "App is running at: http://YOUR_SERVER_IP:3000"
    echo "To view logs: docker logs -f $APP_NAME"
    ;;

  *)
    echo "Usage: ./deploy.sh [local|render|fly|dokku|vps]"
    echo ""
    echo "Platforms:"
    echo "  local   - Run locally with Docker Compose (default)"
    echo "  render  - Deploy to Render.com"
    echo "  fly     - Deploy to Fly.io"
    echo "  dokku   - Deploy to Dokku (self-hosted PaaS)"
    echo "  vps     - Deploy to any VPS with Docker"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh local       # Run on localhost:3000"
    echo "  ./deploy.sh fly         # Deploy to Fly.io"
    echo "  ./deploy.sh vps         # Deploy to a VPS"
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "  Deploy Complete!"
echo "=========================================="
