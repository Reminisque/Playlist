var nodePlaylist = (function () {
    var audioCtx = new AudioContext();
    var gain = audioCtx.createGain();
    var songs = [];

    var songPlaylist = document.querySelector("#song-playlist");
    var audio = document.querySelector("#audio");
    var canvas = document.querySelector("#analyserCanvas");
    var addButton = document.querySelector("#add-button");
    var playButton = document.querySelector("#play-button");
    var backButton = document.querySelector("#bwd-button");
    var fwdButton = document.querySelector("#fwd-button");
    var volume = document.querySelector("#vol-control");

    function getPlaylist() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var playlist = JSON.parse(this.response);
                
                songs = [];

                for (var i = 0; i < playlist.length; i++) {
                    songs.push(playlist[i]);
                }
                console.log(songs);
            }
        };
        xhttp.open("GET", "playlist", true);
        xhttp.send();
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
            audio.play();
            playButton.classList.remove("fa-play-circle");
            playButton.classList.add("fa-pause-circle");
        } else {
            audio.pause();
            playButton.classList.remove("fa-pause-circle");
            playButton.classList.add("fa-play-circle");        
        }
    }

    function streamSong(songName) {
        audio.setAttribute("src", "song/" + songName);
        audio.load();
        playPause();
    }

    function bind() {
        addButton.addEventListener("click", getPlaylist);
        playButton.setAttribute("onclick", "nodePlaylist.playPause()");
       
    }

    return {
        getPlaylist: getPlaylist,
        createPlaylist: createPlaylist,
        play: playButton,
        playPause: playPause,
        bind: bind,
        audio: audio,
        streamSong: streamSong
    }
})();

nodePlaylist.bind();

