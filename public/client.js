var nodePlaylist = (function () {
    var audioCtx = new AudioContext();
    var gain = audioCtx.createGain();
    var songs = [];
    var shuffled = [];
    var playlistIndex = 0;
    var shuffleIndex = 0;
    var shuffle = 0;
    var repeat = 0;

    var songPlaylist = document.querySelector("#song-playlist");
    var audio = document.querySelector("#audio");
    var canvas = document.querySelector("#analyserCanvas");
    var addButton = document.querySelector("#add-button");
    var playButton = document.querySelector("#play-button");
    var bwdButton = document.querySelector("#bwd-button");
    var fwdButton = document.querySelector("#fwd-button");
    var volume = document.querySelector("#vol-control");
    var shuffleBtn = document.querySelector("#shuffle-button");
    var repeatBtn = document.querySelector("#repeat-button");
    

    // Requests from server the names of all currently stored songs
    // and saves them in song array
    function getPlaylist() {
        return new Promise(function(resolve, reject) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var playlist = JSON.parse(this.response);
                    songs = [];

                    for (var i = 0; i < playlist.length; i++) {
                        var pair = {};
                        pair[playlist[i]] = i;
                        songs.push(pair);
                    }
                    
                    resolve("Got the playlist. Check song array.");
                }
            };
            xhttp.open("GET", "playlist", true);
            xhttp.send();
        });
    }

    // Creates the playlist using the songs curently stored in songs array
    function createPlaylist() {
        for (var i = 0; i < songs.length; i++) {
            var songButton = document.createElement("button");
            var songButtonText = document.createElement("span");

            songButtonText.appendChild(document.createTextNode(songs[i]));
            songButtonText.classList.add("songText");

            songButton.appendChild(songButtonText);
            songButton.classList.add("btn", "btn-lg", "song");
            songButton.setAttribute("type", "button");
            songButton.setAttribute("onclick", "nodePlaylist.streamSong('" + songs[i] + "')");

            songPlaylist.appendChild(songButton);
        }
    }

    function playPause() {
        if (audio.paused) {
            togglePlayIcon();  
            return audio.play();

        } else {
            togglePlayIcon();
            return audio.pause();
        }
    }

    // Switches play button between play and pause icons
    function togglePlayIcon() {
        if (playButton.classList.contains("fa-play-circle")) {
            playButton.classList.remove("fa-play-circle");
            playButton.classList.add("fa-pause-circle");
        } else {
            playButton.classList.remove("fa-pause-circle");
            playButton.classList.add("fa-play-circle");    
        }
    }

    // Stream and play the song inputted by name
    function streamSong(songName) {
        fetch("song/" + songName)
            .then(response => response.blob())
            .then(blob => {
                audio.src = URL.createObjectURL(blob);
                playlistIndex = songIndex(songName);
                return playPause();
            });
    }


    // Play the next song
    // Binded to fwdButton in bind function
    function nextSong() {
        if (playlistIndex < songs.length - 1) {
            streamSong(songs[++playlistIndex]);
        } else if (playlistIndex === songs.length && repeat) {
            playlistIndex = 0;
            streamSong(songs[0]);
        }
    }

    // Play the previous song
    // Binded to bwdButton in bind function
    function prevSong() {
        if (playlistIndex > 0) {
            streamSong(songs[--playlistIndex]);
        }
    }

    // Set volume to specified value
    function setVolume(value) {
        audio.volume = value/50;
    }

    // Toggles shuffling
    function toggleShuffle() {
        if (shuffle) {
            shuffle = 0;
        } else {
            shuffle = 1;
        }
        return shuffle;
    }
    // Toggle repeating
    function toggleRepeat() {
        if (repeat) {
            repeat = 0;
        } else {
            repeat = 1;
        }
        return repeat;
    }

    // Switch the icon of play button and play next song
    function songEnd() {
        togglePlayIcon();
        nextSong();
    }

    // Get a song's index in the playlist
    function songIndex(song) {
        for (var i = 0; i < songs.length; i++) {
            if (songs[i] === song) {
                return i;
            }
        }
    }

    // Bind click events and other interactions to controls
    function bind() {
        addButton.addEventListener("click", getPlaylist);
        shuffleBtn.addEventListener("click", toggleShuffle);
        repeatBtn.addEventListener("click", toggleRepeat);
        audio.addEventListener("ended", songEnd);
        playButton.setAttribute("onclick", "nodePlaylist.playPause()");
        bwdButton.setAttribute("onclick", "nodePlaylist.prevSong()");
        fwdButton.setAttribute("onclick", "nodePlaylist.nextSong()");
        volume.setAttribute("oninput", "nodePlaylist.setVolume(this.value)");
        volume.setAttribute("onchange", "nodePlaylist.setVolume(this.value)");
    
    }

    function init() {
        bind();
        getPlaylist().then(function () {
            createPlaylist();
        });
    }


    return {
        play: playButton,
        playPause: playPause,
        audio: audio,
        streamSong: streamSong,
        prevSong: prevSong,
        nextSong: nextSong,
        setVolume: setVolume,
        shuffle: toggleShuffle,
        repeat: toggleRepeat,
        init: init
    }

})();

nodePlaylist.init();

