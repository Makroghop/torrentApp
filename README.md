
# Torrent for the Web 🌐

A Next.js application that converts, downloads, and streams torrents directly in the browser through a plain HTTP request.

###### © Holy Mark Makroghop, ISC license.

# Torrent Stream and Download

## REST API Documentation 📚

### Get All Torrents

```json
{
  "endpoint": "/torrents",
  "method": "GET",
  "description": "Returns the list of all torrents"
}
```

### Get Single Torrent

```json
{
  "endpoint": "/torrents/{infoHash}",
  "method": "GET",
  "description": "Returns a single torrent"
}
```

### Get Torrent Stats

```json
{
  "endpoint": "/torrents/{infoHash}/stats",
  "method": "GET",
  "description": "Returns the torrent stats (speed, bandwidth, etc.)"
}
```

### Get M3U Playlist

```json
{
  "endpoint": "/torrents/{infoHash}/files",
  "method": "GET",
  "description": "Returns the M3U playlist"
}
```

### Stream File

```json
{
  "endpoint": " /torrents/{infoHash}/files/{path}",
  "method": "GET",
  "description": "Starts streaming the file (honoring the \`Range\` header)"
}
```

### Pause/Resume Swarm and Peer Discovery

```json
{
  "endpoint": "/torrents/{infoHash}/pause",
  "method": "POST",
  "description": "Pauses/resumes the swarm and peer discovery"
}
```

### Start/Stop Download

```json
{
  "endpoint": ["/torrents/{infoHash}/start", "/torrents/{infoHash}/stop"],
  "method": "POST",
  "description": "Starts/stops the download by selecting/deselecting all files"
}
```

### Start/Stop Downloading a File

```json
{
  "endpoint": [
    "/torrents/{infoHash}/start/{index}",
    "/torrents/{infoHash}/stop/{index}"
  ],
  "method": "POST",
  "description": "Starts/stops downloading a particular file (by index)"
}
```

### Add New Torrent

```json
{
  "endpoint": "/torrents",
  "method": "POST",
  "description": "Adds a new torrent (\`{"link":"magnet link or URL"}\`)"
}
```

### Upload Torrent File

```json
{
  "endpoint": " /upload",
  "method": "POST",
  "description": "Accepts a .torrent file as an attachment (\`file\` field in \`multipart/form-data\`)"
}
```

### Delete Torrent

```json
{
  "endpoint": "/torrents/{infoHash}",
  "method": "DELETE",
  "description": "Deletes the torrent"
}
```

Feel free to use and contribute to this project! 🚀
