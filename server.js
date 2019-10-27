const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: path.join(__dirname, "/playlist"),
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});
const multerOpts = {
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    },
    fileFilter: function(req, file, cb) {
        checkFile(file, cb);
    }
}

function checkFile(file, cb) {
    if (file === undefined) {
        return cb(new Error("No uploaded file to check"));
    }
    const filetypes = /mp3/;
    const ext = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (ext && mimetype) {
        cb(null, true);
    } else {
        return cb(new Error("Wrong file type"), false);
    }
}

const app = express();
const upload = multer(multerOpts).single('songFile');

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
app.post("/upload", function (req, res) {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
            res.send(`File could not be uploaded: ${err.message}`);
        } else {
            console.log(req.file);
            res.status(200).json({
                song: req.file.originalname
            });
        }
    })
});

app.listen(port, function () {
    console.log("Connected to port 5000. Welcome to Playlist!");
});