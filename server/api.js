"use strict";
const next = require("next");
var rangeParser = require("range-parser"),
  pump = require("pump"),
  _ = require("lodash"),
  express = require("express"),
  multipart = require("connect-multiparty"),
  fs = require("fs"),
  store = require("./store"),
  //   progress = require("./progressbar"),
  //   stats = require("./stats"),
  api = express();
var httpServer = require("http").Server(api);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
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
    api.get("/api/hey", (req, res) => {
      res.end("Hello Hey");
    });

    api.use(express.json());
    api.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "OPTIONS, POST, GET, PUT, DELETE"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });

    api.post("/upload", multipart(), function (req, res) {
      var file = req.files && req.files.file;
      if (!file) {
        return res.status(500).send("file is missing");
      }
      store.add(file.path, function (err, infoHash) {
        if (err) {
          console.error(err);
          res.status(500).send(err);
        } else {
          res.send({ infoHash: infoHash });
        }
        fs.unlink(file.path);
      });
    });

    api.get("/torrents/:infoHash", findTorrent, function (req, res) {
      res.send(serialize(req.torrent));
    });

    api.post(
      "/torrents/:infoHash/start/:index?",
      findTorrent,
      function (req, res) {
        var index = parseInt(req.params.index);
        if (index >= 0 && index < req.torrent.files.length) {
          req.torrent.files[index].select();
        } else {
          req.torrent.files.forEach(function (f) {
            f.select();
          });
        }
        res.sendStatus(200);
      }
    );

    api.post(
      "/torrents/:infoHash/stop/:index?",
      findTorrent,
      function (req, res) {
        var index = parseInt(req.params.index);
        if (index >= 0 && index < req.torrent.files.length) {
          req.torrent.files[index].deselect();
        } else {
          req.torrent.files.forEach(function (f) {
            f.deselect();
          });
        }
        res.sendStatus(200);
      }
    );

    api.post("/torrents/:infoHash/pause", findTorrent, function (req, res) {
      req.torrent.swarm.pause();
      res.sendStatus(200);
    });

    api.post("/torrents/:infoHash/resume", findTorrent, function (req, res) {
      req.torrent.swarm.resume();
      res.sendStatus(200);
    });

    api.delete("/torrents/:infoHash", findTorrent, function (req, res) {
      store.remove(req.torrent.infoHash);
      res.sendStatus(200);
    });

    api.get("/torrents/:infoHash/stats", findTorrent, function (req, res) {
      //   res.send(stats(req.torrent));
      res.send("nothing yet");
    });

    api.get("/torrents/:infoHash/files", findTorrent, function (req, res) {
      var torrent = req.torrent;
      res.setHeader("Content-Type", "application/x-mpegurl; charset=utf-8");
      res.send(
        "#EXTM3U\n" +
          torrent.files
            .map(function (f) {
              return (
                "#EXTINF:-1," +
                f.path +
                "\n" +
                req.protocol +
                "://" +
                req.get("host") +
                "/torrents/" +
                torrent.infoHash +
                "/files/" +
                encodeURIComponent(f.path)
              );
            })
            .join("\n")
      );
    });

    api.all(
      '/torrents/:infoHash/files/:path([^"]+)',
      findTorrent,
      function (req, res) {
        var torrent = req.torrent,
          file = _.find(torrent.files, { path: req.params.path });

        if (!file) {
          return res.sendStatus(404);
        }

        if (typeof req.query.ffmpeg !== "undefined") {
          return require("./ffmpeg")(req, res, torrent, file);
        }

        var range = req.headers.range;
        range = range && rangeParser(file.length, range)[0];
        res.setHeader("Accept-Ranges", "bytes");
        res.type(file.name);
        req.connection.setTimeout(3600000);

        if (!range) {
          res.setHeader("Content-Length", file.length);
          if (req.method === "HEAD") {
            return res.end();
          }
          return pump(file.createReadStream(), res);
        }

        res.statusCode = 206;
        res.setHeader("Content-Length", range.end - range.start + 1);
        res.setHeader(
          "Content-Range",
          "bytes " + range.start + "-" + range.end + "/" + file.length
        );

        if (req.method === "HEAD") {
          return res.end();
        }
        pump(file.createReadStream(range), res);
      }
    );
    api.get("*", (req, res) => {
      return handle(req, res);
    });

    function serialize(torrent) {
      if (!torrent.torrent) {
        return { infoHash: torrent.infoHash };
      }
      var pieceLength = torrent.torrent.pieceLength;

      return {
        infoHash: torrent.infoHash,
        name: torrent.torrent.name,
        interested: torrent.amInterested,
        ready: torrent.ready,
        files: torrent.files.map(function (f) {
          // jshint -W016
          var start = (f.offset / pieceLength) | 0;
          var end = ((f.offset + f.length - 1) / pieceLength) | 0;

          return {
            name: f.name,
            path: f.path,
            link:
              "/torrents/" +
              torrent.infoHash +
              "/files/" +
              encodeURIComponent(f.path),
            length: f.length,
            offset: f.offset,
            selected: torrent.selection.some(function (s) {
              return s.from <= start && s.to >= end;
            }),
          };
        }),
        // progress: progress(torrent.bitfield.buffer),
      };
    }

    function findTorrent(req, res, next) {
      var torrent = (req.torrent = store.get(req.params.infoHash));
      if (!torrent) {
        return res.sendStatus(404);
      }
      next();
    }

    api.get("/torrents", function (req, res) {
      res.send(store.list().map(serialize));
    });

    api.post("/torrents", function (req, res) {
      store.add(req.body.link, function (err, infoHash) {
        if (err) {
          console.error(err);
          res.status(500).send(err);
        } else {
          res.send({ infoHash: infoHash });
        }
      });
    });
  })

  .catch((err) => {
    console.log(err.stack);
    process.exit(1);
  });

// module.exports = api;
