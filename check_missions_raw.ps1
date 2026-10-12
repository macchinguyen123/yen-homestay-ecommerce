$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Accept', 'application/json')
$mAll = $wc.DownloadString('http://localhost:8081/api/public/owner/missions')
Write-Host "Missions with no param: $mAll"
$sAll = $wc.DownloadString('http://localhost:8081/api/public/owner/missions/submissions')
Write-Host "Submissions count: $((ConvertFrom-Json $sAll).Count)"
