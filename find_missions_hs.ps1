$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Accept', 'application/json')
for ($i = 1; $i -le 100; $i++) {
    $res = $wc.DownloadString("http://localhost:8081/api/public/owner/missions?homestayId=" + $i)
    if ($res.Length -gt 2) {
        Write-Host ("FOUND at homestayId=" + $i + ": " + $res)
        break
    }
}
