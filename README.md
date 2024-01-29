# torrent for the web

A nextjs application that coverts, downloads and stream torrents directly in the browser through a plain http request

###### © Holy Mark Makroghop, ISC license.

# torrent_stream_and_download

# REST API Documentation

```json
{
  "endpoint": "/torrents",
  "method": "GET",
  "description": "will return the list of all torrents"
}
```

```json
{
  "endpoint": "/torrents/{infoHash}",
  "method": "GET",
  "description": "will return a single torrent"
}
```

```json
{
  "endpoint": "/torrents/{infoHash}/stats",
  "method": "GET",
  "description": "will return the torrent stats (speed, bandwidth, etc.)"
}
```

```json
{
  "endpoint": "/torrents/{infoHash}/files",
  "method": "GET",
  "description": "will return the M3U playlist"
}
```

```json
{
  "endpoint": " /torrents/{infoHash}/files/{path}",
  "method": "GET",
  "description": " will start streaming the file (honoring the `Range` header)"
}
```

```json
{
  "endpoint": "/torrents/{infoHash}/pause",
  "method": "POST",
  "description": "will pause/resume the swarm and peer discovery"
}
```

```json
{
  "endpoint": ["/torrents/{infoHash}/start", "/torrents/{infoHash}/stop"],
  "method": "POST",
  "description": "will start/stop the download by selecting/deselecting all files"
}
```

```json
{
  "endpoint": [
    "/torrents/{infoHash}/start/{index}",
    "/torrents/{infoHash}/stop/{index}"
  ],
  "method": "POST",
  "description": "will start/stop downloading a particular file (by index)"
}
```

```json
{
  "endpoint": "/torrents",
  "method": "POST",
  "description": "will add a new torrent (`{"link":"magnet link or URL"`)}"
}
```

```json
{
  "endpoint": " /upload",
  "method": "POST",
  "description": " will accept a .torrent file as an attachment (`file` field in `multipart/form-data`)"
}
```

```json
{
  "endpoint": "/torrents/{infoHash}",
  "method": "DELETE",
  "description": "will delete the torrent"
}
```

