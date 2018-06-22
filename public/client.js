var nodePlaylist = (function () {
    var audioCtx = new AudioContext();
    var gain = audioCtx.createGain();
    var songs = [];
    var playlistIndex = 0;

    var songPlaylist = document.querySelector("#song-playlist");
    var audio = document.querySelector("#audio");
    var canvas = document.querySelector("#analyserCanvas");
    var addButton = document.querySelector("#add-button");
    var playButton = document.querySelector("#play-button");
    var bwdButton = document.querySelector("#bwd-button");
    var fwdButton = document.querySelector("#fwd-button");
    var volume = document.querySelector("#vol-control");

    audio.onended = nextSong();

    function getPlaylist() {
        return new Promise(function(resolve, reject) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var playlist = JSON.parse(this.response);
                    songs = [];

                    for (var i = 0; i < playlist.length; i++) {
                        songs.push(playlist[i]);
                    }
                    
                    resolve("Got the playlist. Check song array.");
                }
            };

            xhttp.open("GET", "playlist", true);
            xhttp.send();
        });
    }

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
                return playPause();
            });
    }


    // Play the next song
    // Binded to fwdButton in bind function
    function nextSong() {
        if (playlistIndex < songs.length - 1) {
            streamSong(songs[++playlistIndex]);
        }
    }

    // Play the previous song
    // Binded to bwdButton in bind function
    function prevSong() {
        if (playlistIndex > 0) {
            streamSong(songs[--playlistIndex]);
        }
    }

    function setVolume(value) {
        audio.volume = value/50;
    }

    // Bind click events and other interactions to controls
    function bind() {
        addButton.addEventListener("click", getPlaylist);
        audio.addEventListener("ended", togglePlayIcon);
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
        init: init
    }

})();

nodePlaylist.init();

