Add-Type -AssemblyName System.Drawing

function SampleGrid($path, $name) {
    $img = [System.Drawing.Bitmap]::FromFile((Resolve-Path $path))
    $w = [int]$img.Width
    $h = [int]$img.Height
    Write-Output "$name [$($w)x$($h)]:"
    $rows = 4
    $cols = 4
    for ($r = 0; $r -lt $rows; $r++) {
        $line = ""
        for ($c = 0; $c -lt $cols; $c++) {
            $x = [int](($c + 0.5) * $w / $cols)
            $y = [int](($r + 0.5) * $h / $rows)
            $p = $img.GetPixel($x, $y)
            $line += "#" + $p.R.ToString("X2") + $p.G.ToString("X2") + $p.B.ToString("X2") + " "
        }
        Write-Output "  $line"
    }
    $img.Dispose()
}

SampleGrid 'src\assets\icon\splashscreenIPr.png' "splashscreenIPr"
SampleGrid 'src\assets\LogoDourado.png' "LogoDourado"
SampleGrid 'src\assets\icon\LogoIprapp.png' "LogoIprapp"
SampleGrid 'src\assets\icon\fundoipr.png' "fundoipr"
