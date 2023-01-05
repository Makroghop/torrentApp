"use strict";
////
const express = require("express");
const next = require("next");

////
var rangeParser = require("range-parser");
const pump = require("pump");
const _ = require("lodash");
const multipart = require("connect-multiparty");

////
const fs = require("fs");
const store = require("./store");
const dev = process.env.NODE_ENV !== "production";

////
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 8080;

/////////////////////////////////////////

(async () => {
  try {
    await app.prepare();
    const server = express();

    server.get("/api/hey", (req, res) => {
      res.end("Hello Hey");
    });
    server.get("/", (req, res) => {
      return app.render(req, res, "/index", req.query);
    });

    server.use(express.json());
    server.use(function (req, res, next) {
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

    server.post("/upload", multipart(), function (req, res) {
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

    server.get("/torrents", function (req, res) {
      res.send(store.list().map(serialize));
    });

    server.post("/torrents", function (req, res) {
      store.add(req.body.link, function (err, infoHash) {
        if (err) {
          console.error(err);
          res.status(500).send(err);
        } else {
          res.send({ infoHash: infoHash });
        }
      });
    });

    server.get("/torrents/:infoHash", findTorrent, function (req, res) {
      res.send(serialize(req.torrent));
    });

    server.post(
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

    server.post(
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

    server.post("/torrents/:infoHash/pause", findTorrent, function (req, res) {
      req.torrent.swarm.pause();
      res.sendStatus(200);
    });

    server.post("/torrents/:infoHash/resume", findTorrent, function (req, res) {
      req.torrent.swarm.resume();
      res.sendStatus(200);
    });

    server.delete("/torrents/:infoHash", findTorrent, function (req, res) {
      store.remove(req.torrent.infoHash);
      res.sendStatus(200);
    });

    server.get("/torrents/:infoHash/stats", findTorrent, function (req, res) {
      //   res.send(stats(req.torrent));
      res.send("nothing yet");
    });

    server.get("/torrents/:infoHash/files", findTorrent, function (req, res) {
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

    server.all(
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

    server.all("*", (req, res) => {
      return handle(req, res);
    });
    server.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on localhost:${PORT} - env ${process.env.NODE_ENV}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

//===============================
// FUNCTIONS
//===============================
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
