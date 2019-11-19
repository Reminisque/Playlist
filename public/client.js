var nodePlaylist = (function() {
    const VIS_RADIUS = 100;
    const FREQ_BAR_LEN = 300;       // Mainly for circle visualizer
    const HALF_PI = Math.PI * 0.5;  // Mainly for circle visualizer
    const MIRR_SIZE = 0.6;          // Mirrored bars sizing as percentage
    const SPACING = 0.33;           // SPACING + 
    const SPACE_MIRR_SIZE = 0.5;    // SPACE_MIRR_SIZE = 1
    
    const audio = document.querySelector("#audio");
    const bwdButton = document.querySelector("#bwd-button");
    const canvas = document.querySelector("#analyserCanvas");
    const content = document.querySelector("#content");
    const fwdButton = document.querySelector("#fwd-button");
    const playButton = document.querySelector("#play-button");
    const repeatButton = document.querySelector("#repeat-button");
    const seekbar = document.querySelector("#seekbar");
    const shuffleButton = document.querySelector("#shuffle-button");
    const songPlaylist = document.querySelector("#song-playlist");
    const songCurrTime = document.querySelector("#song-curr-time");
    const songDuration = document.querySelector("#song-duration");
    const upload = document.querySelector("#upload-song");
    const volume = document.querySelector("#vol-control");
    const visChoices = document.querySelectorAll(
        ".vis-group .vis-choice input[name='visualizer']");
    const pop = document.querySelector("#pop-msg");

    let debug = true;
    
    let audioCtx = new AudioContext();
    let analyser = audioCtx.createAnalyser();
    let gain = audioCtx.createGain();
    let frequencyData;

    let songs = [];
    let songButtons = {};
    let shuffled = [];
    let playlistIndex = -1;
    let shuffleIndex = -1;
    let shuffle = 0;
    let repeat = 0;

    let canvasContext = canvas.getContext("2d");


    let requestID;

    let visual = document.querySelector(
        "#visualizers .vis-choice input[name='visualizer']:checked").value;

    let audioSrc = audioCtx.createMediaElementSource(audio);

    function log(toLog) {
        if (debug) {
            console.log(toLog);
        }
    }

    // Uploads user-selected song to server
    function uploadSong() {
        var xhttp = new XMLHttpRequest();
        var songFile = upload.files[0];
        var formData = new FormData();

        // Clear file from input so reuploading same file triggers change event
        upload.value = null;
        
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                log(this.response);
                let res = JSON.parse(this.response);
                if (res["err"]) {
                    popup("fade-in", "fade-out", 1000, 2000, `Upload failed: ${res["err"]}`);
                } else {
                    let songName = res["song"];
                    if (playlistAdd(songName) === true) {
                        songs.push(songName);
                        popup("fade-in", "fade-out", 1000, 3000, `${songName} UPLOADED`);
                    } else {
                        popup("fade-in", "fade-out", 1000, 2000, `${songName} REPLACED`); 
                    }
                }
            }
        };
        
        formData.append("songFile", songFile);
        xhttp.open("POST", "upload", true);
        xhttp.send(formData);
    }

    // Add song button to playlist
    function playlistAdd(songName) {
        if (songButtons[songName] != undefined) {
            return false;
        }
        
        var songButton = document.createElement("button");
        var songButtonText = document.createElement("span");

        songButtonText.appendChild(document.createTextNode(songName));
        songButtonText.classList.add("songText");

        songButton.appendChild(songButtonText);
        songButton.classList.add("btn", "btn-lg", "song");
        songButton.setAttribute("type", "button");
        songButton.addEventListener("click", function() {
            streamSong(songName);
        });

        songPlaylist.appendChild(songButton);
        songButtons[songName] = {
            button: songButton,
            index: songs.length
        }

        return true;
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
                        playlistAdd(playlist[i]);
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

    // Plays and pauses the song and toggles the play button icon
    // based on audio state (playing or paused)
    function playPause() {
        if (requestID != null) {
            cancelAnimationFrame(requestID);
            requestID = null;
        }
        // Check for audio source to prevent an interrupt error 
        //  when there is no audio loaded and user attempts to
        //  stream a song after having toggled the play button
        if (audio.paused && audio.src) {
            playButton.classList.remove("fa-play-circle");
            playButton.classList.add("fa-pause-circle");
            if (requestID == null) {
                updateVis();
            }
            return audio.play();
        } else {
            playButton.classList.remove("fa-pause-circle");
            playButton.classList.add("fa-play-circle");
            return audio.pause();
        }
    }

    // Stream and play the song inputted by name
    function streamSong(songName) {
        audio.src = "song/" + songName;
        audio.load();

        // Highlight the song the playlist and remove old highlight
        if (playlistIndex >= 0) {
            songButtons[songs[playlistIndex]].button.classList.remove("active");
        }
        playlistIndex = songButtons[songName].index;
        songButtons[songName].button.classList.add("active");
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
                log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
            } else if (shuffleIndex >= shuffled.length - 1 && repeat) {
                shuffleIndex = 0;
                streamSong(songs[shuffled[0]]);
                log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
            }
        } else {
            if (playlistIndex < songs.length - 1) {
                streamSong(songs[playlistIndex + 1]);
                log ("Playlist Index: " + (playlistIndex));
            } else if (playlistIndex >= songs.length - 1 && repeat) {
                streamSong(songs[0]);
                log ("Playlist Index: " + (playlistIndex));
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
                log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
 
            } else if (shuffleIndex <= 0 && repeat) {
                shuffleIndex = shuffled.length - 1;
                streamSong(songs[shuffled[shuffled.length - 1]]);
                log (
                    "Shuffle Index: " + shuffleIndex
                    + " --song-> " + shuffled[shuffleIndex]);
            }
        } else {
            if (playlistIndex > 0) {
                streamSong(songs[playlistIndex-1]);
                log ("Playlist Index: " + (playlistIndex));
            } else if (playlistIndex <= 0 && repeat) {
                streamSong(songs[songs.length-1]);
                log ("Playlist Index: " + (playlistIndex));
            }
        }
    }

    // Set volume to specified value
    function setVolume(value) {
        audio.volume = value/(parseInt(volume.max) + 10);
    }

    // Toggles shuffling
    function toggleShuffle() {
        if (shuffle) {
            shuffle = 0;
        } else {
            shuffle = 1;
            shuffleIndex = 0;
            log(createShuffle());
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

    // Handle song ending by going to next song or stopping animation if at end
    function songEnd() {
        if (!repeat && ((shuffle && shuffleIndex == shuffled.length - 1) || playlistIndex === songs.length - 1)) {
            setTimeout(function() {
                if (audio.paused) {
                    if (requestID != null) {
                        cancelAnimationFrame(requestID);
                        requestID = null;
                    }
                    playButton.classList.remove("fa-pause-circle");
                    playButton.classList.add("fa-play-circle");
                }
            }, 1000);
        } else {
            nextSong();
        }
    }

    // Get the array that has the shuffled playlist indeces
    function getShuffled() {
        return shuffled;
    }

    function refreshCanvas() {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = content.offsetWidth;
        canvas.height = content.offsetHeight;
    }
    
    // === Visualizer Around Circle ===
    function drawCirVis(type) {
        const BINS = 180;
        const HALF_CANVAS_WIDTH = canvas.width / 2;
        const HALF_CANVAS_HEIGHT = canvas.height / 2;

        canvasContext.lineWidth = 3;

        // Circle at center that bars with will be draw around
        canvasContext.beginPath();
        canvasContext.arc(
            HALF_CANVAS_WIDTH,      // center x-coord
            HALF_CANVAS_HEIGHT,     // center y-coord
            VIS_RADIUS,             // radius
            0,                      // start angle (radians)
            Math.PI*2               // end angle (radians)
        );
        
        for (var i = 0; i < BINS; i++) {
            let barLength = Math.pow(frequencyData[i + Math.ceil(i / 90)], 3) / Math.pow(255, 3);
            barLength *= FREQ_BAR_LEN

            switch(type) {
                // === Vertical Mirrored Halves ===
                case "mirroredY":
                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI * (i) / BINS - HALF_PI),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin(Math.PI * (i) / BINS - HALF_PI)
                    );

                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI * (i) / BINS - HALF_PI),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI * (i) / BINS - HALF_PI) 
                    )

                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI * (BINS - i - 1) / BINS + HALF_PI),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin(Math.PI * (BINS - i - 1) / BINS + HALF_PI)
                    );

                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI * (BINS - i - 1) / BINS + HALF_PI),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI * (BINS - i - 1) / BINS + HALF_PI) 
                    );
                    break;
                // === Horizontal Mirrored Halves ===
                case "mirroredX":
                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI + Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin(Math.PI + Math.PI * i / BINS)
                    );
                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI + Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI + Math.PI * i / BINS)
                    );

                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI - Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin(Math.PI - Math.PI * i / BINS)
                    );
                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI - Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI - Math.PI * i / BINS)
                    );
                    break;
                // === Horizontal Reversed Halves ===
                case "flippedX":
                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin(Math.PI * i / BINS)
                    );
                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI * i / BINS)
                    );

                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI + Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin(Math.PI + Math.PI * i / BINS)
                    );
                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI + Math.PI * i / BINS),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI + Math.PI * i / BINS)
                    );
                    break;
                // === Full Circle ===
                default:
                    canvasContext.moveTo(
                        HALF_CANVAS_WIDTH + VIS_RADIUS * Math.cos(Math.PI * 2 * i / BINS - HALF_PI),
                        HALF_CANVAS_HEIGHT + VIS_RADIUS * Math.sin( Math.PI * 2 * i / BINS - HALF_PI)
                    );
                    canvasContext.lineTo(
                        HALF_CANVAS_WIDTH + (VIS_RADIUS + barLength) * Math.cos(Math.PI * 2 * i / BINS - HALF_PI),
                        HALF_CANVAS_HEIGHT + (VIS_RADIUS + barLength) * Math.sin(Math.PI * 2 * i / BINS - HALF_PI)
                    );
            }
        }
        canvasContext.stroke();      
    }
    
    // === Bar Graph Visualizer ===
    function drawBarVis(type) {
        const BINS = canvas.width / 3;
        const BAR_WIDTH = canvas.width / BINS;
        const HALF_CANVAS_HEIGHT = canvas.height / 2;

        let x_coord = 0;

        // Draw bars
        for (var i = 0; i < BINS; i++) {
            let barLength = Math.pow(frequencyData[i + Math.ceil(i / 90)], 3) / Math.pow(255, 3);

            switch(type) {
                // === Spaced Mirrored Bars ===
                case "spacedMirrored":
                    canvasContext.beginPath();
                    canvasContext.moveTo(0, HALF_CANVAS_HEIGHT);
                    canvasContext.lineTo(canvas.width, HALF_CANVAS_HEIGHT);
                    canvasContext.stroke();
                    // Top Half
                    canvasContext.fillRect(
                        x_coord,
                        HALF_CANVAS_HEIGHT * (1 - barLength * SPACING),
                        BAR_WIDTH,
                        -HALF_CANVAS_HEIGHT * barLength * SPACE_MIRR_SIZE
                    );
                    // Bottom Half
                    canvasContext.fillRect(
                        x_coord,
                        HALF_CANVAS_HEIGHT * (1 + barLength * SPACING),
                        BAR_WIDTH,
                        HALF_CANVAS_HEIGHT * barLength * SPACE_MIRR_SIZE
                    );
                    break;    
                // === Full Bars ===          
                case "full":
                    canvasContext.fillRect(
                        x_coord,
                        HALF_CANVAS_HEIGHT,
                        BAR_WIDTH,
                        -HALF_CANVAS_HEIGHT * barLength
                    );
                    break;
                // === Mirrored Bars ===
                default:
                    canvasContext.beginPath();
                    canvasContext.moveTo(0, HALF_CANVAS_HEIGHT);
                    canvasContext.lineTo(canvas.width, HALF_CANVAS_HEIGHT);
                    canvasContext.stroke();
                    canvasContext.fillRect(
                        x_coord,
                        HALF_CANVAS_HEIGHT * (1 - barLength * MIRR_SIZE),
                        BAR_WIDTH,
                        canvas.height * barLength * MIRR_SIZE
                    );                   
            }
            //Set new starting x-coordinate for next bar
            x_coord += BAR_WIDTH + 1;
        }
    }

    // Updates the frequency graph visualization every frame
    function updateVis() {
        refreshCanvas();
        canvasContext.strokeStyle = "#b388ff";
        canvasContext.fillStyle = "#b388ff";
        
        // Get the frequency data and calculate the bar width
        analyser.getByteFrequencyData(frequencyData);
        // log(frequencyData);
        
        switch(visual) {
            case "fullBar":
                drawBarVis("full");
                break;
            case "fullCircle":
                drawCirVis("full");
                break;
            case "flippedCircleX":
                drawCirVis("flippedX");
                break;
            case "mirroredCircleY":
                drawCirVis("mirroredY");
                break;
            case "mirroredSpacedBars":
                drawBarVis("spacedMirrored");
                break;
            default:
                drawBarVis("mirrored");
        }
      
        // log("Frames");
        requestID = requestAnimationFrame(updateVis);

    }

    // Function for popup notification appear and its configuration
    // inAnim, outAnim -> class name with CSS animation
    // animDuration, duration -> time in ms     
    function popup(inAnim, outAnim, animTime, duration, message) {
        if (message != undefined) {
            pop.innerHTML = message;
        }

        pop.classList.add("show", inAnim);
        setTimeout(function() { 
            pop.classList.add(outAnim);
            setTimeout(function() {
                pop.classList.remove("show", inAnim, outAnim);
                pop.innerHTML = "";
            }, animTime);
        }, animTime + duration);
    }

    function formatMinSec(time) {
        if (time === Infinity) {
            return NaN;
        }
        let t = parseInt(time);
        let minutes = Math.floor(t / 60);
        let seconds = ("0" + Math.ceil(t % 60)).slice(-2);        
        return `${minutes}:${seconds}`;
    }

    // Bind click events and other interactions to controls
    function bind() {
        // Audio tag bindings
        audio.addEventListener("ended", songEnd);
        audio.addEventListener("canplay", function() {
            if (audio.paused) {
                playPause();
            }
        });
        audio.addEventListener("stalled", function() {
            playPause();
            log("Stalled and waiting for data");
        });
        audio.addEventListener("loadedmetadata", function() {
            songCurrTime.innerHTML = "0:00";
            songDuration.innerHTML = formatMinSec(audio.duration);
            seekbar.value = 0;
            seekbar.max = Math.ceil(audio.duration);
            // log(audio.duration);
            // log(seekbar.max);
        });
        audio.addEventListener("timeupdate", function() {
           songCurrTime.innerHTML = formatMinSec(audio.currentTime);
           seekbar.value = Math.ceil(audio.currentTime);
        });

        // Playlist bindings
        upload.addEventListener("change", uploadSong);
        shuffleButton.addEventListener("click", toggleShuffle);
        repeatButton.addEventListener("click", toggleRepeat);

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
        for (var i = 0; i < visChoices.length; i++) {
            visChoices[i].addEventListener("change", function() {
                visual = this.value;
                log(`Visualizer selected: ${visual}`);
            });
        }
    

        

        // SEEKING CURRENTLY DOES NOT WORK PROPERLY NOR CONSISTENTLY
        // seekbar.addEventListener("input", function() {
        //     audio.pause();
        //     log(`input: ${seekbar.value}`); 
        // });
        // seekbar.addEventListener("change", function() {
        //     if (audio.src) {
        //         log(seekbar.value);
        //         audio.currentTime = parseInt(seekbar.value);
        //         audio.play();
        //     }
        //     log(`change: ${seekbar.value}`); 
        //  });

        // Chrome Autoplay policy suspends the audio context,
        // so have to resume on user interaction
        window.addEventListener("click", function() {
            if (audioCtx.state === "suspended") {
                audioCtx.resume().then(() => {
                    log("Audio Context resumed");
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
        getPlaylist();

        setVolume(volume.value);
        log(canvasContext.fillStyle);
        log(canvasContext.strokeStyle);
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
        init: init,
    }
})();

nodePlaylist.init();

