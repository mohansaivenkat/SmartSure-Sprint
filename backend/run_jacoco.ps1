$env:JAVA_HOME="C:\Users\b sathvik\.antigravity\extensions\redhat.java-1.53.0-win32-x64\jre\21.0.10-win32-x86_64"
$services = Get-ChildItem -Directory | Where-Object { Test-Path "$($_.FullName)\pom.xml" } | Where-Object { $_.Name -ne 'auth-service' }
foreach ($service in $services) {
    Write-Host "Running tests for $($service.Name)..."
    Push-Location $service.FullName
    ..\apache-maven-3.9.5\bin\mvn.cmd clean verify
    Pop-Location
}
