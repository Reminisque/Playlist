var playlistIndex = -1;
var context = new AudioContext();
var gainNode = context.createGain();
var songBuffer = null;
var repeat = 0;
var shuffle = 0;

gainNode.connect(context.destination);

// Loads songs from folder in back end, creates an entry for
// each song in the DOM and adds them to the playlist
function loadSongs() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // Typical action to be performed when the document is ready:
            var myarray = JSON.parse(xhttp.response);
            console.log(myarray);
            var playlist = document.getElementById("song-playlist")

            // Delete all of the songs already in the playlist
            // while (playlist.hasChildNodes()) {
            //     playlist.removeChild(playlist.lastChild);
            // }

            // Create each song entry element and insert into playlist
            for (var i = 0; i < myarray.length; i++) {
                // Button element and its text
                var newSong = document.createElement("button");
                var newSongText = document.createElement("span");

                // Set song entry name
                newSongText.appendChild(document.createTextNode(myarray[i]));
                newSongText.classList.add("songText");

                // Set song entry button attributes and
                // link button to route to stream song
                newSong.appendChild(newSongText);
                newSong.classList.add("btn", "btn-lg", "song");
                newSong.setAttribute("type", "button");
                newSong.setAttribute("onclick", "streamSong('" + myarray[i] + "')");
                newSong.setAttribute("data-toggle", "button");
                newSong.setAttribute("aria-pressed", "falsed");

                // Add song entry to the playlist
                playlist.appendChild(newSong);
            }
        }
    }
    xhttp.open("GET", "playlist", true);
    xhttp.send();
}

// Plays the inputted song
// Send a GET request to the server with the name of the song
function streamSong(songName) {
    if (songName === null) {
        return;
    }

    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "song/" + songName, true);
    xhttp.responseType = "arraybuffer";
    xhttp.onload = function () {
        context.decodeAudioData(xhttp.response, function (getBuffer) {
            // Stop the current song
            if (songBuffer !== null) {
                songBuffer.disconnect();
            }
            // Create new audio buffer, set the buffer to audio data
            songBuffer = context.createBufferSource();
            songBuffer.buffer = getBuffer;
            // When the song ends play the next song
            songBuffer.onended = function (event) {
                playNext(currentIndex());
            }
            songBuffer.connect(gainNode);
            // Resume if currently paused before starting song
            if (context.state === "suspended") {
                playPause();
            }
            playlistIndex = songIndex(songName);
            // Play the song
            songBuffer.start(0);
        });
    }
    xhttp.send();
}

// Find the index of the song in the playlist
function songIndex(songName) {
    var songs = document.getElementsByClassName("song");
    for (var i = 0; i < songs.length; i++) {
        if (songs[i].textContent === songName) {
            return i;
        }
    }
    // Return -1 if song does not exist in the playlist
    return -1;
}

// Find name of song in playlist given index
function getSongName(index) {
    var songs = document.getElementsByClassName("song");
    // Check that index is valid
    if (0 <= index && index < songs.length) {
        return songs[index].textContent;
    } else {
        console.log(index);
        return null;
    }
}

// Play or pause the current song
function playPause() {
    // Pause if playing and change pause button to play
    // Resume if paused and change play button to pause
    if (context.state === "running") {
        context.suspend().then(function () {
            console.log(context.state);
        });
        var playButton = document.getElementById("play-button");
        playButton.classList.remove("fa-pause-circle");
        playButton.classList.add("fa-play-circle");
    } else if (context.state === "suspended") {
        context.resume().then(function () {
            console.log(context.state);
        });
        var playButton = document.getElementById("play-button");
        playButton.classList.remove("fa-play-circle");
        playButton.classList.add("fa-pause-circle");
    }
}

// Play the next song in playlist given index
function playNext(index) {
    var songs = document.getElementsByClassName("song");
    // If not on last song then play the next song on playlist
    // else if last song and repeat is on then play first song
    if (index >= 0 && index < songs.length - 1) {
        streamSong(getSongName(index + 1));
    } else if (index + 1 === songs.length && repeat) {
        streamSong(getSongName(0));
    }
}

// Play the previous song in playlist given index
function playPrev(index) {
    var songs = document.getElementsByClassName("song");
    if (index > 0 && index <= songs.length - 1) {
        streamSong(getSongName(index-1));
    } else if (index === 0 && repeat) {
        streamSong(getSongName(songs.length - 1));
    }
}

function currentIndex() {
    return playlistIndex;
}

function toggleRepeat() {
    if (repeat) {
        repeat = 0;
    } else {
        repeat = 1;
    }
}

function toggleShuffle() {
    if (shuffle) {
        shuffle = 0;
    } else {
        shuffle = 1;
    }
}

function init() {
    loadSongs();
    document.getElementById("play-button").setAttribute("onclick", "playPause()");
    document.getElementById("fwd-button").setAttribute("onclick", "playNext(currentIndex())");
    document.getElementById("bwd-button").setAttribute("onclick", "playPrev(currentIndex())");
    document.getElementById("shuffle-button").addEventListener("click", function () {
        toggleShuffle();
    });
    document.getElementById("repeat-button").addEventListener("click", function () {
        toggleRepeat();
    });
}

init();

