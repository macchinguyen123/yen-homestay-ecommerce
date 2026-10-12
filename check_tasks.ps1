$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Accept', 'application/json')
$tasksJson = $wc.DownloadString('http://localhost:8081/api/public/rooms')
$rooms = ConvertFrom-Json $tasksJson
Write-Host "Total rooms: $($rooms.Count)"
$tasks = @()
foreach ($r in $rooms) {
    if ($r.tasks) {
        foreach ($t in $r.tasks) {
            $tasks += $t
        }
    }
}
Write-Host "Total tasks found from rooms: $($tasks.Count)"
$tasks | Select-Object -First 5 id, homestayId, title, status | Format-Table
