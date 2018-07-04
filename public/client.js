var nodePlaylist = (function () {
    const audio = document.querySelector("#audio");
    const addButton = document.querySelector("#add-button");
    const bwdButton = document.querySelector("#bwd-button");
    const canvas = document.querySelector("#analyserCanvas");
    const fwdButton = document.querySelector("#fwd-button");
    const playButton = document.querySelector("#play-button");
    const repeatBtn = document.querySelector("#repeat-button");
    const shuffleBtn = document.querySelector("#shuffle-button");
    const songPlaylist = document.querySelector("#song-playlist");
    const volume = document.querySelector("#vol-control");
    var songButtons;

    var audioCtx = new AudioContext();
    var analyser = audioCtx.createAnalyser();
    var gain = audioCtx.createGain();
    var frequencyData;
    var songs = [];
    var shuffled = [];  // Shuffled song indeces
    var playlistIndex = -1;
    var shuffleIndex = 0;
    var shuffle = 0;
    var repeat = 0;
    var canvasContext = canvas.getContext("2d");

    var audioSrc = audioCtx.createMediaElementSource(audio);

    // Requests from server the names of all currently stored songs
    //  and saves them in song array
    function getPlaylist() {
        return new Promise(function(resolve, reject) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    let playlist = JSON.parse(this.response);
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

        songButtons = document.getElementsByClassName("song");
    }

    // Plays and pauses the song and toggles the play button icon
    //  based on audio state (playing or paused)
    function playPause() {
        // Check for audio source to prevent an interrupt error 
        //  when there is no audio loaded and user attempts to
        //  stream a song after having toggled the play button
        if (audio.paused && audio.src) {
            playButton.classList.remove("fa-play-circle");
            playButton.classList.add("fa-pause-circle");
            return audio.play();

        } else {
            playButton.classList.remove("fa-pause-circle");
            playButton.classList.add("fa-play-circle");
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
                if (playlistIndex >= 0) {
                    songButtons[playlistIndex].classList.remove("active");
                }
                playlistIndex = songIndex(songName);
                songButtons[playlistIndex].classList.add("active");
                return playPause();
            });
    }

    // Randomizes/shuffles the elements in given array
    function randomize(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var randomIndex = Math.floor(Math.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[randomIndex];
            arr[randomIndex] = temp;
        }
        return arr;
    }
    
    // Create the shuffled playlist
    function createShuffle() {
        shuffled = [];
        for (var i = 0; i < songs.length; i++) {
            shuffled.push(i);
        }
        return randomize(shuffled);
    }

    // Play the next song
    // Binded to fwdButton in bind function
    function nextSong() {
        if (shuffle) {
            if (shuffleIndex < shuffled.length - 1) {
                streamSong(songs[shuffled[shuffleIndex]]);
                console.log ("Shuffle Index: " + shuffleIndex
                + " --song-> " + shuffled[shuffleIndex]);
                shuffleIndex += 1;
            } else if (shuffleIndex >= shuffled.length - 1 && repeat) {
                streamSong(songs[shuffled[0]]);
                shuffleIndex = 0;
                console.log ("Shuffle Index: " + shuffleIndex
                + " --song-> " + shuffled[shuffleIndex]);
            }     

        } else {
            if (playlistIndex < songs.length - 1) {
                streamSong(songs[playlistIndex+1]);
            } else if (playlistIndex >= songs.length - 1 && repeat) {
                streamSong(songs[0]);
            }
            console.log ("Playlist Index: " + (playlistIndex + 1));
        }  
    }

    // Play the previous song
    // Binded to bwdButton in bind function
    function prevSong() {
        if (playlistIndex > 0) {
            streamSong(songs[playlistIndex-1]);
        } else if (playlistIndex <= 0 && repeat) {
            streamSong(songs[songs.length-1]);
        }
        return ("Playlist Index: " + playlistIndex);
    }

    // Set volume to specified value
    function setVolume(value) {
        audio.volume = value/50;
        gain.gain.setValueAtTime(value/50, audioCtx.currentTime);
    }

    // Toggles shuffling
    function toggleShuffle() {
        if (shuffle) {
            shuffle = 0;
        } else {
            shuffle = 1;
            shuffleIndex = 0;
            console.log(createShuffle());
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

    // Get a song's index in the playlist
    function songIndex(songName) {
        for (var i = 0; i < songs.length; i++) {
            if (songs[i] === songName) {
                return i;
            }
        }
    }

    // Plays the next song and toggles the play button
    // To be used when a song ends to ensure play button toggle
    function songEnd() {
        nextSong();
        togglePlayIcon();
    }

    // Get the array that has the shuffled playlist indeces
    function getShuffled() {
        return shuffled;
    }
    
    // Updates the frequency graph visualization every frame
    function updateFreq() {
        requestAnimationFrame(updateFreq);
        
        // Get the frequency data and calculate the bar width
        analyser.getByteFrequencyData(frequencyData);
        const bufferLength = analyser.frequencyBinCount;
        const barWidth = (canvas.width/bufferLength);
        let x_coord = 0;    // Starting x-coordinate

        // Clear the canvas before drawing new bars
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < bufferLength; i++) {
            let barHeight = frequencyData[i];

            canvasContext.fillStyle = "#b388ff";
            canvasContext.fillRect(
                x_coord,
                canvas.height - (canvas.height * (barHeight/255)),
                barWidth,
                canvas.height * (barHeight/255));

            // Set new starting x-coordinate for next bar
            x_coord += barWidth + 1;
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
        // Connect the nodes in audio graph
        audioSrc.connect(gain);
        gain.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256;
        frequencyData = new Uint8Array(analyser.frequencyBinCount);

        // Bind all buttons and get the playlist
        bind();
        getPlaylist().then(function () {
            createPlaylist();
        });

        // Setup canvas dimensions and update the frequency graph
        const content = document.getElementById("content");
        canvas.width = content.offsetWidth;
        canvas.height = content.offsetHeight;
        updateFreq();
    }

    
    return {
        playPause: playPause,
        streamSong: streamSong,
        prevSong: prevSong,
        nextSong: nextSong,
        setVolume: setVolume,
        shuffle: toggleShuffle,
        createShuffle: createShuffle,
        shuffleIndex: shuffleIndex,
        repeat: toggleRepeat,
        shuffled: getShuffled,
        init: init
    }
})();

nodePlaylist.init();

