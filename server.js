const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// fs.readdir(path.join(__dirname, "/public/playlist"), function(err, items) {
//     console.log(items);

//     for (var i=0; i<items.length; i++) {
//         console.log(items[i]);
//     }
// })


var port = 5000;

app.use(express.static(path.join(__dirname, "/public")));

// Get playlist
// All requests routed to this path will be returned an array
// containing the names of all songs currently stored on the server
app.get("/playlist", function (req, res) {
    fs.readdir(path.join(__dirname, "/playlist"), function (err, items) {
        // for (var i=0; i<items.length; i++) {
        //     items[i] = path.parse(items[i]).name;
        // }
        res.send(items);
    });
});

// Get song
// All requests routed to this path will be streamed
// the song identified by parameter songId
app.get("/song/:songId", function (req, res) {
    songPath = path.join(__dirname, "/playlist", req.params.songId);
    fs.createReadStream(songPath).pipe(res);
});

// Upload song
app.get("/upload", function (req, res) {
    res.send("UPLOADED");
});

app.listen(port, function () {
    console.log("Connected to port 5000. Welcome to Playlist!");
});