const next = require("next");
const express = require("express");
const server = express();
var httpServer = require("http").Server(server);
var io = require("socket.io")(httpServer);

var torrentStream = require("torrent-stream");
var request = require("request").defaults({ encoding: null });
var os = require("os");
var fs = require("fs");
var path = require("path");
var del = require("del");
var mime = require("mime");
var archiver = require("archiver");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

var client, url;
// var DIR = tmpdir(os.tempdir) + "/torrent-web-poc";
var DIR = path.join(__dirname, "/torrent-poc");
var PORT = process.env.PORT || 8080;

/////////////////////////////////////////
app
  .prepare()
  .then(() => {
    httpServer.listen(PORT);
    //   app.use(express.static(__dirname + "/public"));

    console.log("Torrent Web started on port " + PORT + " ...");

    server.get("/api/hey", (req, res) => {
      res.end("Hello Hey");
    });
    //===============================
    // API
    //===============================

    io.on("connection", (socket) => {
      console.log("New socket connection.");
      if (client && client.files.length)
        socket.emit("torrent", torrentRepresentation());
      else socket.emit("no-torrent");
      socket.on("add-torrent", addTorrent);
      socket.on("remove-torrent", removeTorrent);
    });

    server.get("/torrent/:filename", (req, res) => {
      console.log("Torrent file request.");
      var file = findFile(req.params.filename);
      if (file) {
        var stream = file.createReadStream();
        res.set("Content-Type", mime.lookup(file.name));
        res.set("Content-Length", file.length);
        stream.pipe(res);
      } else res.status(404).end();
    });

    server.get("/torrent/", function (req, res) {
      var archive = archiver.create("zip", {});
      var filename = client.torrent.name + ".zip";
      res.set("Content-Type", "application/zip");
      res.set("Content-disposition", "attachment; filename=" + filename);
      archive.pipe(res);
      client.files.forEach(function (file) {
        archive.append(file.createReadStream(), { name: file.path });
      });
      archive.finalize();
    });
    server.get("*", (req, res) => {
      return handle(req, res);
    });
    //===============================
    // Main functions
    //===============================

    function findFile(filename) {
      var f = null;
      client.files.forEach(function (file) {
        if (file.name === filename) f = file;
      });
      return f;
    }

    function addTorrent(incoming) {
      // removeTorrent();
      url = incoming;
      console.log(url);
      if (url.indexOf("magnet:") === 0) createTorrentEngine(url);
      else {
        request.get(url, function (err, res, body) {
          createTorrentEngine(body);
        });
      }
    }

    function removeTorrent() {
      if (client) {
        console.log("Destroying client.");
        client.destroy();
        client = null;

        io.emit("torrent-removed");
      }
      deleteFiles();
    }

    //===============================
    // Helper functions
    //===============================

    /**
     * Checks process.argv for one beginning with arg+'='
     * @param {string} arg
     */
    function parseArg(arg) {
      for (var i = 0; i < process.argv.length; i++) {
        var val = process.argv[i];
        if (startsWith(val, arg + "=")) return val.substring(arg.length + 1);
      }
      function startsWith(string, beginsWith) {
        return string.indexOf(beginsWith) === 0;
      }
    }

    function deleteFiles() {
      setTimeout(function () {
        del.sync(DIR + "/**", { force: true });
      }, 1000);
    }

    function createTorrentEngine(torrent) {
      try {
        client = torrentStream(torrent, {
          uploads: 10,
          connections: 30,
          path: DIR,
        });
        client.ready(torrentReady);
      } catch (e) {
        console.log("Error creating torrent", e);
        io.emit("bad-torrent");
      }
    }

    function torrentReady() {
      io.emit("torrent", torrentRepresentation());
      console.log("client:", client);
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

    function torrentRepresentation() {
      return {
        url: url,
        name: client.torrent.name,
        comment: client.torrent.comment,
        infoHash: client.infoHash,
        files: simplifyFilesArray(client.files),
      };
    }
  })
  .catch((err) => {
    console.log(err.stack);
    process.exit(1);
  });
