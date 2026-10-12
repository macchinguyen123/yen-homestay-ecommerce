$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Accept', 'application/json')
$sql = "SELECT task_id, homestay_id, title, status, icon, reward_type FROM guest_tasks"
# Let's check via Spring Boot endpoint or database query
$hsList = $wc.DownloadString('http://localhost:8081/api/public/rooms')
$rooms = ConvertFrom-Json $hsList
Write-Host "Homestays found in rooms: $($rooms | Select-Object -ExpandProperty homestayId -Unique)"
