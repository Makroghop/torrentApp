const next = require("next");
const express = require("express");
const server = express();
var httpServer = require("http").Server(server);

var TorrentStream = require("torrent-stream");
var request = require("request").defaults({ encoding: null });
var path = require("path");
var del = require("del");
var mime = require("mime");
var archiver = require("archiver");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

var torrents = [];
var DIR = path.join(__dirname, "/torrent-poc");
var PORT = process.env.PORT || 8080;

/////////////////////////////////////////
app
  .prepare()
  .then(() => {
    httpServer.listen(PORT);

    console.log("Torrent Web started on port " + PORT + " ...");

    //===============================
    // API
    //===============================
    server.get("/api/hey", (req, res) => {
      res.end("Hello Hey");
    });

    server.get("/download/", async (req, res) => {
      console.log("Torrent file request.");
      var torrentUrl = (req.query.torrent = req.query.torrent.indexOf("magnet:")
        ? req.query.torrent
        : request.get(torrentUrl, function (err, res, body) {
            return body;
          }));

      var file = req.query.filename;
      if (!torrentUrl && !file) {
        res.status(400).send("Invalid request");
        return;
      }

      try {
        var parsed;
        console.log(torrentUrl);
        if (torrentUrl.indexOf("magnet:") === 0) {
          parsed = new TorrentStream(torrentUrl, {
            path: DIR,
          });
          arrange(parsed);
        } else {
          request.get(torrentUrl, function (err, res, body) {
            parsed = new TorrentStream(body, {
              path: DIR,
            });
            arrange(parsed);
          });
        }
        function arrange(par) {
          par.on("ready", () => {
            const $file = findFile(file, par);

            // Create a stream for the file
            var stream = $file.createReadStream();
            res.set("Content-Type", mime.lookup($file.name));
            res.set("Content-Length", $file.length);
            stream.pipe(res);
          });
        }
      } catch (e) {
        console.log(e);
        res.status(404).end();
      }
    });

    server.get("/upload/", (req, res) => {
      let torrentUrl = req.query.file;
      if (!torrentUrl) {
        res.status(400).send("Invalid request");
        return;
      }
      try {
        var parsed;
        console.log(torrentUrl);
        if (torrentUrl.indexOf("magnet:") === 0) {
          parsed = new TorrentStream(torrentUrl);
          arrange(parsed);
        } else {
          request.get(torrentUrl, function (err, res, body) {
            parsed = new TorrentStream(body);
            arrange(parsed, torrentUrl);
          });
        }
        function arrange(par) {
          par.on("ready", () => {
            console.log(par);
            const structObj = {
              torrentUrl,
              parsed: torrentRepresentation(par),
            };
            torrents.push({ torrentUrl, name: par.name });
            res.send(structObj);
          });
        }
      } catch (e) {
        console.log(e);
        res.send("error ocurred");
      }
    });
    //===============================
    // Helper Functions
    //===============================
    function findFile(filename, engine) {
      var f = null;
      engine.files.forEach(function (file) {
        if (file.name === filename) f = file;
      });
      return f;
    }
    function simplifyFilesArray(files) {
      return files.map(function (file) {
        return {
          name: file.name,
          path: file.path,
          length: file.length,
        };
      });
    }

    function torrentRepresentation(parsed) {
      return {
        name: parsed.torrent.name,
        comment: parsed.torrent.comment,
        infoHash: parsed.infoHash,
        files: simplifyFilesArray(parsed.files),
      };
    }

    async function downloadTorrent(torrentFileOrMagnetLink, file) {
      console.log(torrentFileOrMagnetLink);
      var engine;
      if (torrentFileOrMagnetLink.indexOf("magnet:") === 0) {
        engine = new TorrentStream(torrentFileOrMagnetLink, {
          path: DIR,
        });
        action(engine);
      } else {
        request.get(torrentFileOrMagnetLink, function (err, res, body) {
          engine = new TorrentStream(body, {
            path: DIR,
          });
          action(engine);
        });
      }

      function action(engine__) {
        // engine__.ready(() => console.log("client:", engine__));

        return new Promise((resolve, reject) => {
          engine__.on("ready", () => {
            // Choose the file that you want to download
            const $file = findFile(file, engine__);

            // Create a readable stream of the file
            const stream = $file.createReadStream();

            resolve(stream);
          });

          engine__.on("error", (err) => {
            reject(err);
          });
        });
      }
    }
    server.get("*", (req, res) => {
      return handle(req, res);
    });
  })

  .catch((err) => {
    console.log(err.stack);
    process.exit(1);
  });
