$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Accept', 'application/json')
try {
    $b = $wc.DownloadString('http://localhost:8081/api/public/owner/bookings')
    Write-Host "Bookings length: $($b.Length)"
} catch {
    Write-Host "Bookings error: $_"
}
try {
    $m = $wc.DownloadString('http://localhost:8081/api/public/owner/missions')
    Write-Host "Missions length: $($m.Length), content: $m"
} catch {
    Write-Host "Missions error: $_"
}
try {
    $s = $wc.DownloadString('http://localhost:8081/api/public/owner/missions/submissions')
    Write-Host "Submissions length: $($s.Length), content: $s"
} catch {
    Write-Host "Submissions error: $_"
}
