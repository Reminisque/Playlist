var nodePlaylist = (function () {
    const audio = document.querySelector("#audio");
    const addButton = document.querySelector("#add-button");
    const bwdButton = document.querySelector("#bwd-button");
    const canvas = document.querySelector("#analyserCanvas");
    const content = document.getElementById("content");
    const fwdButton = document.querySelector("#fwd-button");
    const playButton = document.querySelector("#play-button");
    const repeatBtn = document.querySelector("#repeat-button");
    const shuffleBtn = document.querySelector("#shuffle-button");
    const songPlaylist = document.querySelector("#song-playlist");
    const volume = document.querySelector("#vol-control");
    let songButtons;

    let audioCtx = new AudioContext();
    let analyser = audioCtx.createAnalyser();
    let gain = audioCtx.createGain();
    let frequencyData;
    let songs = [];
    let shuffled = [];  // Shuffled song indeces
    let playlistIndex = -1;
    let shuffleIndex = -1;
    let shuffle = 0;
    let repeat = 0;
    let canvasContext = canvas.getContext("2d");
    let visRadius = 100;
    let freqBarLength = 300;

    let audioSrc = audioCtx.createMediaElementSource(audio);

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

            xhttp.onerror = function () {
                reject({
                    status: this.status,
                    statusText: this.statusText
                });
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
        audio.src = "song/" + songName;
        audio.load();

        // Highlight the song the playlist and remove old highlight
        if (playlistIndex >= 0) {
            songButtons[playlistIndex].classList.remove("active");
        }
        playlistIndex = songIndex(songName);    // Update index
        songButtons[playlistIndex].classList.add("active");

        //-----OLD----//
        // fetch("song/" + songName)
        //     .then(response => response.blob())
        //     .then(blob => {
        //         audio.src = URL.createObjectURL(blob);
        //         audio.load();
        //         audio.oncanplay = playPause;
        //         if (playlistIndex >= 0) {
        //             songButtons[playlistIndex].classList.remove("active");
        //         }
        //         playlistIndex = songIndex(songName);
        //         songButtons[playlistIndex].classList.add("active");
        //     });
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
                shuffleIndex++;
                streamSong(songs[shuffled[shuffleIndex]]);
                console.log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
            } else if (shuffleIndex >= shuffled.length - 1 && repeat) {
                streamSong(songs[shuffled[0]]);
                shuffleIndex = 0;
                console.log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
            }     
        } else {
            if (playlistIndex < songs.length - 1) {
                streamSong(songs[playlistIndex + 1]);
                console.log ("Playlist Index: " + (playlistIndex));
            } else if (playlistIndex >= songs.length - 1 && repeat) {
                streamSong(songs[0]);
                console.log ("Playlist Index: " + (playlistIndex));
            }
        }  
    }

    // Play the previous song
    // Binded to bwdButton in bind function
    function prevSong() {
        if (shuffle) {
            if (shuffleIndex > 0) {
                shuffleIndex--;
                streamSong(songs[shuffled[shuffleIndex]]);
                console.log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
 
            } else if (shuffleIndex <= 0 && repeat) {
                streamSong(songs[shuffled[shuffled.length - 1]]);
                shuffleIndex = shuffled.length - 1;
                console.log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
            }
        } else {
            if (playlistIndex > 0) {
                streamSong(songs[playlistIndex-1]);
                console.log ("Playlist Index: " + (playlistIndex));
            } else if (playlistIndex <= 0 && repeat) {
                streamSong(songs[songs.length-1]);
                console.log ("Playlist Index: " + (playlistIndex));
            }
        }
    }

    // Set volume to specified value
    function setVolume(value) {
        audio.volume = value/60;
        gain.gain.setValueAtTime(value/60, audioCtx.currentTime);
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

    function refreshCanvas() {
        // Clear the canvas before drawing new bars
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = content.offsetWidth;
        canvas.height = content.offsetHeight;
        
    }
    
    // Draw circular visualization
    function drawCirVis() {
        const bins = 150;

        canvasContext.strokeStyle = "#b388ff";
        canvasContext.lineWidth = 3;

        // Circle at center that bars with will be draw around
        canvasContext.beginPath();
        canvasContext.arc(
            canvas.width/2,     // center x-coord
            canvas.height/2,    // center y-coord
            visRadius,          // radius
            0,                  // start angle (radians)
            Math.PI*2           // end angle (radians)
        );
        canvasContext.stroke();

        // Draw bars
        for (var i = 0; i < bins; i++) {
            let barLength = frequencyData[i]/255;

            for(var j = 0; j < 2; j++) {
                barLength = Math.log2(barLength + 1);
            }

            barLength = Math.pow(barLength * 2, 4) / 16;

            barLength *= freqBarLength;

            if (i === 0) {
                console.log(barLength);
            }

            canvasContext.beginPath();

            // === Full Circle ===
            canvasContext.moveTo(
                canvas.width/2 + visRadius * Math.cos(Math.PI * 2 * i / bins),
                canvas.height/2 + visRadius * Math.sin( Math.PI * 2 *i / bins)
            )
            canvasContext.lineTo(
                canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * 2 * i / bins),
                canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * 2 * i / bins)
            )
            
            // === Opposite Half Circles ===
            // canvasContext.moveTo(
            //     canvas.width/2 + visRadius * Math.cos(Math.PI * i / bins),
            //     canvas.height/2 + visRadius * Math.sin(Math.PI * i / bins)
            // )
            // canvasContext.lineTo(
            //     canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * i / bins),
            //     canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * i / bins)
            // )

            // canvasContext.moveTo(
            //     canvas.width/2 + visRadius * Math.cos(Math.PI + Math.PI * i / bins),
            //     canvas.height/2 + visRadius * Math.sin(Math.PI + Math.PI * i / bins)
            // )
            // canvasContext.lineTo(
            //     canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI + Math.PI * i / bins),
            //     canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI + Math.PI * i / bins)
            // )

            // === Top to Bottom ===
            // canvasContext.moveTo(
            //     canvas.width/2 + visRadius * Math.cos(Math.PI * (i) / bins - (0.5 * Math.PI)),
            //     canvas.height/2 + visRadius * Math.sin(Math.PI * (i) / bins - (0.5 * Math.PI))
            // );

            // canvasContext.lineTo(
            //     canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * (i) / bins - (0.5 * Math.PI)),
            //     canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * (i) / bins - (0.5 * Math.PI)) 
            // )

            // canvasContext.moveTo(
            //     canvas.width/2 + visRadius * Math.cos(Math.PI * (bins - i) / bins + (0.5 * Math.PI)),
            //     canvas.height/2 + visRadius * Math.sin(Math.PI * (bins - i) / bins + (0.5 * Math.PI))
            // );

            // canvasContext.lineTo(
            //     canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * (bins - i) / bins + (0.5 * Math.PI)),
            //     canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * (bins - i) / bins + (0.5 * Math.PI)) 
            // )

            canvasContext.stroke();
        }
        
    }
    
    function drawBarVis() {
        canvasContext.fillStyle = "#b388ff";

        const bins = 256;
        const barWidth = (2*canvas.width/bins)-1;
        let x_coord = 0;    // Starting x-coordinate

        // Draw bars
        for (var i = 0; i < bins; i++) {
            // === Bar Graph Visualizer ===
            let barHeight = frequencyData[i]/255;

            let barWidth2 = 1 + (9 - Math.log2(2*i+1));

            for(var j = 0; j < 3; j++) {
                barHeight = Math.log2(barHeight + 1);
            }

            barHeight = Math.pow(barHeight * 2, 4) / 16;

            if (i === 0) {
                console.log(barHeight);
            }

            canvasContext.fillRect(
                x_coord,
                canvas.height - (canvas.height * barHeight),
                barWidth2,
                canvas.height * barHeight
            );
            //Set new starting x-coordinate for next bar
            x_coord += barWidth2 + 1;
        }

    }

    // Updates the frequency graph visualization every frame
    function updateVis() {
        requestAnimationFrame(updateVis);

        refreshCanvas();

        // Get the frequency data and calculate the bar width
        prevfrequencyData = frequencyData.slice();
        analyser.getByteFrequencyData(frequencyData);
        // console.log(frequencyData);
        // drawCirVis();
        drawBarVis();

    }

    function freqData() {
        return frequencyData;
    }

    function data() {
        console.log(freqData());
    }

    // Bind click events and other interactions to controls
    function bind() {
        addButton.addEventListener("click", getPlaylist);
        shuffleBtn.addEventListener("click", toggleShuffle);
        repeatBtn.addEventListener("click", toggleRepeat);
        audio.addEventListener("ended", songEnd);
        audio.addEventListener("canplay", playPause);
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


        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.9;


        frequencyData = new Uint8Array(analyser.frequencyBinCount);

        // Bind all buttons and get the playlist
        bind();
        getPlaylist().then(function () {
            createPlaylist();
        });

        setVolume(volume.value);

        // Setup canvas dimensions and update the frequency graph
        updateVis();
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
        freq: data,
        init: init
    }
})();

nodePlaylist.init();

