$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $gameRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$gamePort = 8765
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $gamePort)
try {
    $listener.Start()
    $gameUrl = "http://127.0.0.1:$gamePort/index.html"
    Write-Host "ARTEMIS MISSION LAB: $gameUrl"
    Write-Host 'Mantén esta ventana abierta mientras juegas. Ctrl+C para detener el servidor.'
    Start-Process $gameUrl
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $stream.ReadTimeout = 5000
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            if (-not $requestLine) { continue }
            do { $headerLine = $reader.ReadLine() } while ($headerLine)
            $parts = $requestLine.Split(' ')
            $method = $parts[0]
            $requestPath = [Uri]::UnescapeDataString($parts[1].Split('?')[0]).TrimStart('/')
            if (-not $requestPath) { $requestPath = 'index.html' }
            $filePath = [IO.Path]::GetFullPath([IO.Path]::Combine($gameRoot, $requestPath.Replace('/', [IO.Path]::DirectorySeparatorChar)))
            $status = '200 OK'
            $mime = 'text/plain; charset=utf-8'
            if ($method -notin @('GET', 'HEAD')) {
                $status = '405 Method Not Allowed'
                $body = [Text.Encoding]::UTF8.GetBytes('Solo GET y HEAD.')
            } elseif (-not $filePath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                $status = '403 Forbidden'
                $body = [Text.Encoding]::UTF8.GetBytes('Ruta fuera del juego.')
            } elseif (-not [IO.File]::Exists($filePath)) {
                $status = '404 Not Found'
                $body = [Text.Encoding]::UTF8.GetBytes('Archivo no encontrado.')
            } else {
                $body = [IO.File]::ReadAllBytes($filePath)
                $mime = switch ([IO.Path]::GetExtension($filePath).ToLowerInvariant()) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.js' { 'text/javascript; charset=utf-8' }
                    '.css' { 'text/css; charset=utf-8' }
                    '.txt' { 'text/plain; charset=utf-8' }
                    default { 'application/octet-stream' }
                }
            }
            $headers = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n")
            $stream.Write($headers, 0, $headers.Length)
            if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
            $stream.Flush()
        } catch {
            # A cancelled browser request must not stop the local game server.
        } finally {
            $client.Dispose()
        }
    }
} catch {
    Write-Host "No se pudo iniciar el servidor local en el puerto $gamePort. $($_.Exception.Message)"
    Read-Host 'Pulsa Enter para cerrar'
} finally {
    $listener.Stop()
}
