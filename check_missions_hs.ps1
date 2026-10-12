$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Accept', 'application/json')
$m1 = $wc.DownloadString('http://localhost:8081/api/public/owner/missions?homestayId=1')
Write-Host "Missions with homestayId=1: $m1"
$m2 = $wc.DownloadString('http://localhost:8081/api/public/owner/missions?homestayId=2')
Write-Host "Missions with homestayId=2: $m2"
