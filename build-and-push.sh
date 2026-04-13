#!/bin/bash
# SmartSure Build and Push Automation Script
# Usage: ./build-and-push.sh nanipuneeth11k

set -e

DOCKER_USERNAME=${1:?"Usage: ./build-and-push.sh <dockerhub-username>"}
TAG="latest"

# List of services with their relative paths
BACKEND_SERVICES=(
  "eureka-server"
  "config-server"
  "api-gateway"
  "auth-service"
  "admin-service"
  "policy-service"
  "claims-service"
  "payment-service"
  "notification-service"
)

echo "Logging in to Docker Hub..."
docker login

# Loop through and build/push backend services
for SERVICE in "${BACKEND_SERVICES[@]}"; do
  IMAGE="$DOCKER_USERNAME/smartsure-$SERVICE:$TAG"
  echo ""
  echo "Building $IMAGE from ./backend/$SERVICE ..."
  docker build -t "$IMAGE" "./backend/$SERVICE"
  echo "Pushing $IMAGE ..."
  docker push "$IMAGE"
  echo "$SERVICE done."
done

# Build/Push frontend
IMAGE_FRONTEND="$DOCKER_USERNAME/smartsure-frontend:$TAG"
echo ""
echo "Building $IMAGE_FRONTEND from ./frontend ..."
docker build -t "$IMAGE_FRONTEND" "./frontend"
echo "Pushing $IMAGE_FRONTEND ..."
docker push "$IMAGE_FRONTEND"

echo ""
echo "All SmartSure images built and pushed successfully!"
