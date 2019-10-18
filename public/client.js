var nodePlaylist = (function() {
    const audio = document.querySelector("#audio");
    const bwdButton = document.querySelector("#bwd-button");
    const canvas = document.querySelector("#analyserCanvas");
    const fwdButton = document.querySelector("#fwd-button");
    const playButton = document.querySelector("#play-button");
    const repeatBtn = document.querySelector("#repeat-button");
    const shuffleBtn = document.querySelector("#shuffle-button");
    const songPlaylist = document.querySelector("#song-playlist");
    const upload = document.querySelector("#upload-song");
    const volume = document.querySelector("#vol-control");

    const content = document.getElementById("content");
    
    let songButtons;
    let requestID;

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


    function uploadSong() {
        console.log("uploadSong WORK IN PROGRESS");
        // return new Promise(function(resolve, reject) {
        //    var xhttp = new XMLHttpRequest(); 
           
        // });
    }

    // Requests from server the names of all currently stored songs
    //  and saves them in song array
    function getPlaylist() {
        return new Promise(function(resolve, reject) {
            var xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    let playlist = JSON.parse(this.response);
                    songs = [];

                    for (var i = 0; i < playlist.length; i++) {
                        songs.push(playlist[i]);
                    }
                    
                    resolve("Got the playlist. Check song array.");
                }
            };

            xhttp.onerror = function() {
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
    // based on audio state (playing or paused)
    function playPause() {
        // Check for audio source to prevent an interrupt error 
        //  when there is no audio loaded and user attempts to
        //  stream a song after having toggled the play button
        if (requestID != null) {
            cancelAnimationFrame(requestID);
            requestID = null;
        }
        if (audio.paused && audio.src) {
            playButton.classList.remove("fa-play-circle");
            playButton.classList.add("fa-pause-circle");
            updateVis();
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
        cancelAnimationFrame(requestID);
        requestID = null;
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
        const bins = 180;

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
            let barLength = Math.pow(frequencyData[i + Math.ceil(i / 90)], 3) / Math.pow(255, 3);

            barLength *= freqBarLength;

            canvasContext.beginPath();

            // === Full Circle ===
            // canvasContext.moveTo(
            //     canvas.width/2 + visRadius * Math.cos(Math.PI * 2 * i / bins),
            //     canvas.height/2 + visRadius * Math.sin( Math.PI * 2 *i / bins)
            // )
            // canvasContext.lineTo(
            //     canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * 2 * i / bins),
            //     canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * 2 * i / bins)
            // )
            
            // === Opposite Horizontal Halves ===
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

            // === Vertical Mirrored Halves ===
            let halfPi = Math.PI * 0.5

            canvasContext.moveTo(
                canvas.width/2 + visRadius * Math.cos(Math.PI * (i) / bins - halfPi),
                canvas.height/2 + visRadius * Math.sin(Math.PI * (i) / bins - halfPi)
            );

            canvasContext.lineTo(
                canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * (i) / bins - halfPi),
                canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * (i) / bins - halfPi) 
            )

            canvasContext.moveTo(
                canvas.width/2 + visRadius * Math.cos(Math.PI * (bins - i - 1) / bins + halfPi),
                canvas.height/2 + visRadius * Math.sin(Math.PI * (bins - i - 1) / bins + halfPi)
            );

            canvasContext.lineTo(
                canvas.width/2 + (visRadius + barLength) * Math.cos(Math.PI * (bins - i - 1) / bins + halfPi),
                canvas.height/2 + (visRadius + barLength) * Math.sin(Math.PI * (bins - i - 1) / bins + halfPi) 
            )

            // Draw
            canvasContext.stroke();
        }
        
    }
    
    function drawBarVis() {
        canvasContext.fillStyle = "#b388ff";

        const bins = canvas.width / 4;
        const barWidth = canvas.width / bins;
        let x_coord = 0;    // Starting x-coordinate

        // Draw bars
        for (var i = 0; i < bins; i++) {
            // === Bar Graph Visualizer ===
            let barLength = Math.pow(frequencyData[i + Math.ceil(i / 90)], 3) / Math.pow(255, 3);

            canvasContext.fillRect(
                x_coord,
                canvas.height -     ((canvas.height-1) * barLength),
                barWidth,
                canvas.height * barLength
            );

            //Set new starting x-coordinate for next bar
            x_coord += barWidth + 1;
        }

    }

    // Updates the frequency graph visualization every frame
    function updateVis() {
        refreshCanvas();
        
        // Get the frequency data and calculate the bar width
        analyser.getByteFrequencyData(frequencyData);
        // console.log(frequencyData);
        // drawCirVis();
        drawBarVis();

        requestID = requestAnimationFrame(updateVis);

    }

    function freqData() {
        return frequencyData;
    }

    function data() {
        console.log(freqData());
    }

    // Bind click events and other interactions to controls
    function bind() {
        // Audio tag bindings
        audio.addEventListener("ended", songEnd);
        audio.addEventListener("canplay", playPause);

        // Playlist bindings
        upload.addEventListener("change", function() {
            console.log(upload.value);
        });
        shuffleBtn.addEventListener("click", toggleShuffle);
        repeatBtn.addEventListener("click", toggleRepeat);

        // Controls bindings
        playButton.addEventListener("click", playPause);
        bwdButton.addEventListener("click", prevSong);
        fwdButton.addEventListener("click", nextSong);
        volume.addEventListener("input", function() {
            setVolume(this.value);
        });
        volume.addEventListener("change", function() {
            setVolume(this.value);
        });

        // Chrome Autoplay policy suspends the audio context,
        // so have to resume on user interaction
        window.addEventListener("click", function() {
            if (audioCtx.state === "suspended") {
                audioCtx.resume().then(() => {
                    console.log("Audio Context resumed -__-")
                });
            }
        });
    }

    function init() {
        // Connect the nodes in audio graph
        audioSrc.connect(gain);
        gain.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.86;

        frequencyData = new Uint8Array(1024);

        // Bind all buttons and get the playlist
        bind();
        getPlaylist().then(function() {
            createPlaylist();
        });

        setVolume(volume.value);
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

