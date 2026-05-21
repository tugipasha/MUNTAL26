$dir = Join-Path $PSScriptRoot '..\public\images'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
# Minimal valid JPEG (warm grey, 1x1 — Three.js scales on curved tiles)
$b64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
$bytes = [Convert]::FromBase64String($b64)
1..10 | ForEach-Object {
  [IO.File]::WriteAllBytes((Join-Path $dir "img$_.jpg"), $bytes)
}
Write-Host 'Wrote img1.jpg … img10.jpg'
