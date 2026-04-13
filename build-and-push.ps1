# SmartSure Build and Push Automation Script (PowerShell)
# Usage: .\build-and-push.ps1 nanipuneeth11k

param (
    [Parameter(Mandatory=$true)]
    [string]$DockerUsername
)

$ErrorActionPreference = "Stop"
$Tag = "latest"

$BackendServices = @(
    "eureka-server",
    "config-server",
    "api-gateway",
    "auth-service",
    "admin-service",
    "policy-service",
    "claims-service",
    "payment-service",
    "notification-service"
)

Write-Host "Logging in to Docker Hub..." -ForegroundColor Cyan
docker login

foreach ($Service in $BackendServices) {
    $Image = "${DockerUsername}/smartsure-${Service}:${Tag}"
    Write-Host "`nBuilding $Image from ./backend/$Service ..." -ForegroundColor Green
    docker build -t $Image "./backend/$Service"
    Write-Host "Pushing $Image ..." -ForegroundColor Magenta
    docker push $Image
    Write-Host "$Service done." -ForegroundColor Gray
}

# Build/Push frontend
$ImageFrontend = "$DockerUsername/smartsure-frontend:$Tag"
Write-Host "`nBuilding $ImageFrontend from ./frontend ..." -ForegroundColor Green
docker build -t $ImageFrontend "./frontend"
Write-Host "Pushing $ImageFrontend ..." -ForegroundColor Magenta
docker push $ImageFrontend

Write-Host "`nAll SmartSure images built and pushed successfully!" -ForegroundColor Cyan
