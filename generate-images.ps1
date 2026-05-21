$ErrorActionPreference = 'Stop'
$outDir = Join-Path $PSScriptRoot 'public\images'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing

function Get-Rgb([double]$h, [double]$s, [double]$l) {
  $c = (1 - [Math]::Abs(2 * $l - 1)) * $s
  $x = $c * (1 - [Math]::Abs(($h / 60) % 2 - 1))
  $m = $l - $c / 2
  $r = 0; $g = 0; $b = 0
  if ($h -lt 60) { $r = $c; $g = $x }
  elseif ($h -lt 120) { $r = $x; $g = $c }
  elseif ($h -lt 180) { $g = $c; $b = $x }
  elseif ($h -lt 240) { $g = $x; $b = $c }
  elseif ($h -lt 300) { $r = $x; $b = $c }
  else { $r = $c; $b = $x }
  return [System.Drawing.Color]::FromArgb(
    [int](($r + $m) * 255),
    [int](($g + $m) * 255),
    [int](($b + $m) * 255)
  )
}

$width = 800
$height = 1200
$enc = [System.Drawing.Imaging.ImageFormat]::Jpeg

for ($i = 1; $i -le 10; $i++) {
  $color = Get-Rgb (26 + $i * 16) 0.2 (0.34 + ($i % 4) * 0.03)
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $brush = New-Object System.Drawing.SolidBrush $color
  $g.FillRectangle($brush, 0, 0, $width, $height)
  $brush.Dispose()
  $g.Dispose()
  $path = Join-Path $outDir "img$i.jpg"
  $bmp.Save($path, $enc)
  $bmp.Dispose()
  Write-Host "Wrote $path"
}
