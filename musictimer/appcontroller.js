const AppController = (function (UICtrl, APICtrl, PlaylistGenerator) {
    const originalTitle = document.title;

    const DOMInputs = UICtrl.inputField();

    var sources = null;
    var userPlaylists = null;
    var sourceType = null;
    var sourceItem = null;
    var generatedPlaylist = [];
    var loading = false;
    var loadingSongFeatures = false;
    var sourceTypeUsesItem = true;

    var onLoad = () => null;
    var needsFeatures = false;
    var needsGenres = false;

    var state = null;
    var updateStateInterval = 5000;
    var stateTimer = null;

    var clock = null;
    var updateClockInterval = 1000;
    var clockTimer = null;

    const SONG_SPACING = 500; // ms between songs

    function setOnLoad(_needsFeatures, _needsGenres, _onLoad) {
        onLoad = _onLoad;
        needsFeatures = _needsFeatures;
        needsGenres = _needsGenres;

        onLoad = () => {
            if (needsFeatures && !APICtrl.hasLikedSongFeatures()) {
                APICtrl.getLikedSongFeatures((t) => UICtrl.setInfoText(t)).then(
                    onLoad
                );
            } else if (needsGenres && !APICtrl.hasLikedSongGenres()) {
                APICtrl.getUserGenres((t) => UICtrl.setInfoText(t)).then(
                    onLoad
                );
            } else {
                _onLoad();
                loading = false;
            }
        };

        if (!loading) {
            APICtrl.getLikedSongs((t) => UICtrl.setInfoText(t)).then(() => {
                onLoad();
            });
        }

        loading = true;
    }

    const start = async () => {
        const loggedIn = await APICtrl.init();
        if (loggedIn) {
            updateSourceType();
            stateTimer = setInterval(updateState, updateStateInterval);
        }
    };

    const loadPlaylists = async () => {
        onLoad = () => null;
        UICtrl.setItemInputPrompt("Playlist: ");
        sources = await APICtrl.getUserPlaylists();
        userPlaylists = sources.slice();
        UICtrl.addSourceItem("Liked Songs", "liked songs");
        sources.forEach((element) =>
            UICtrl.addSourceItem(element.name, element.id)
        );
        UICtrl.setInfoText("Choose a length and playlist to start!");
    };

    const loadArtists = async () => {
        onLoad = () => null;
        UICtrl.setItemInputPrompt("Artist: ");
        sources = await APICtrl.getUserArtists();
        sources.sort((a, b) => (a.name > b.name ? 1 : -1));
        sources.forEach((element) =>
            UICtrl.addSourceItem(element.name, element.name)
        );
        UICtrl.setInfoText("Choose a length and artist to start!");
    };

    const loadArtistsLikedSongs = async () => {
        UICtrl.setItemInputPrompt("Artist: ");
        sources = await APICtrl.getUserArtists();
        sources.sort((a, b) => (a.name > b.name ? 1 : -1));
        sources.forEach((element) =>
            UICtrl.addSourceItem(element.name, element.id)
        );
        sourceItem = "";

        setOnLoad(false, false, async () => {
            if (sourceItem !== "") {
                updateTracklist();
            } else {
                UICtrl.setInfoText("Choose a length and artist to start!");
            }
        });
        UICtrl.setInfoText("Choose a length and artist to start!");
    };

    const loadGenres = async () => {
        UICtrl.setItemInputPrompt("Genre: ");
        setOnLoad(false, true, async () => {
            sources = await APICtrl.getUserGenres((t) => UICtrl.setInfoText(t));
            sources.sort();
            sources.forEach((element) =>
                UICtrl.addSourceItem(element, element)
            );
            UICtrl.setInfoText("Choose a length and genre to start!");
        });
    };

    const loadDecades = async () => {
        UICtrl.setItemInputPrompt("Decade: ");
        setOnLoad(true, false, async () => {
            sources = await APICtrl.getUserDecades((t) =>
                UICtrl.setInfoText(t)
            );
            sources.sort();
            sources.forEach((element) =>
                UICtrl.addSourceItem(element, element)
            );
            UICtrl.setInfoText("Choose a length and decade to start!");
        });
    };

    const loadFeature = async (featureName) => {
        UICtrl.setRangeInputPrompt(
            featureName.replace("_", " ").titleCase() +
                (featureName !== "tempo" ? " (%):" : "")
        );
        setOnLoad(true, false, async () => {
            UICtrl.setInfoText(
                "Choose a length and set " + featureName + " values to start!"
            );
            if (UICtrl.hasFeatureMax() || UICtrl.hasFeatureMin()) {
                updateTracklist();
            }
        });
        sourceItem = "";
    };

    const loadKeys = async (featureName) => {
        UICtrl.setItemInputPrompt("Key: ");
        setOnLoad(true, false, async () => {
            sources = await APICtrl.getUserKeys((t) => UICtrl.setInfoText(t));
            sources.sort();
            sources.forEach((element) =>
                UICtrl.addSourceItem(element, element)
            );
            UICtrl.setInfoText("Choose a length and key to start!");
        });
    };

    const loadTimeSignatures = async (featureName) => {
        UICtrl.setItemInputPrompt("Time Signature: ");
        setOnLoad(true, false, async () => {
            sources = await APICtrl.getUserTimeSignatures((t) =>
                UICtrl.setInfoText(t)
            );
            sources.sort();
            sources.forEach((element) =>
                UICtrl.addSourceItem(element, element)
            );
            UICtrl.setInfoText("Choose a length and time signature to start!");
        });
    };

    const updateTracklist = async () => {
        UICtrl.resetTracks();
        var tracks;

        if (sourceTypeUsesItem) {
            if (sourceItem === "") return;
        } else {
            if (!UICtrl.hasFeatureMax() && !UICtrl.hasFeatureMin()) {
                return;
            }
            if (
                UICtrl.hasFeatureMax() &&
                UICtrl.hasFeatureMin() &&
                UICtrl.getFeatureMax() < UICtrl.getFeatureMin()
            ) {
                console.log("invalid range");
                return;
            }
        }

        UICtrl.setInfoText("Loading tracks...");

        switch (sourceType) {
            case "Playlist":
                tracks = await APICtrl.getTracksFromPlaylist(sourceItem, (t) =>
                    UICtrl.setInfoText(t)
                );
                break;
            case "Artist":
                tracks = await APICtrl.getTracksFromArtist(sourceItem, (t) =>
                    UICtrl.setInfoText(t)
                );
                break;
            case "Artist (liked songs only)":
                tracks = await APICtrl.getLikedTracksFromArtist(
                    sourceItem,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Genre (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithGenre(sourceItem, (t) =>
                    UICtrl.setInfoText(t)
                );
                break;
            case "Decade (liked songs only)":
                tracks = await APICtrl.getLikedSongsFromDecade(
                    sourceItem,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Acousticness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "acousticness",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Danceability (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "danceability",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Energy (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "energy",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Instrumentalness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "instrumentalness",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Liveness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "liveness",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Speechiness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "speechiness",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Tempo (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "tempo",
                    UICtrl.getFeatureMin(),
                    UICtrl.getFeatureMax(),
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Valence (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "valence",
                    UICtrl.getFeatureMin() * 0.01,
                    UICtrl.getFeatureMax() * 0.01,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Time signature (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(
                    "time_signature",
                    sourceItem,
                    sourceItem,
                    (t) => UICtrl.setInfoText(t)
                );
                break;
            case "Key (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithKey(sourceItem, (t) =>
                    UICtrl.setInfoText(t)
                );
                break;
        }
        PlaylistGenerator.setTracklist(tracks, SONG_SPACING);

        generatePlaylist();
    };

    const generatePlaylist = async () => {
        var maxLength = UICtrl.inputField().maxSongLength;
        if (maxLength <= 0) maxLength = Infinity;

        var range = UICtrl.inputField().lengthRange;
        if (range < 0) range = 499; // default to within one second

        var maxTracks = UICtrl.inputField().maxTracks;
        if (maxTracks <= 0) maxTracks = -1;

        await UICtrl.setInfoText("Generating playlist...");

        // Allows the info text to be updated
        setTimeout(function () {
            generatedPlaylist = PlaylistGenerator.generate(
                UICtrl.inputField().length - range,
                UICtrl.inputField().length + range,
                UICtrl.inputField().minSongLength,
                maxLength,
                UICtrl.inputField().minTracks,
                maxTracks,
            );

            UICtrl.resetTracks();

            generatedPlaylist.forEach((el, num) =>
                UICtrl.createTrack(
                    el.id,
                    num,
                    el.name,
                    el.artists.map((a) => a.name).join(", "),
                    el.duration_ms 
                )
            );
            UICtrl.startPlaylistAnimation();

            UICtrl.setInfoText(
                PlaylistGenerator.getNumTracks() +
                    " songs, " +
                    PlaylistGenerator.getDuration().toHHMMSS()
            );
        }, 1);
    };

    const savePlaylist = async () => {
        if (generatedPlaylist.length > 0) {
            const defaultName = "Spotify Music Timer";
            var name = await window.prompt(
                "Enter a name for the playlist: ",
                defaultName
            );
            if (name === "") return;
            const playlistURIs = generatedPlaylist.map((a) => a.uri);

            var id = null;
            if (name === defaultName) {
                if (userPlaylists === null) {
                    userPlaylists = await APICtrl.getUserPlaylists();
                }
                var defaultPlaylistID = null;
                defaultPlaylistCreated = userPlaylists.some(function (p) {
                    defaultPlaylistID = p.id;
                    if (p.name === defaultName) return true;
                });
                if (defaultPlaylistCreated) {
                    id = defaultPlaylistID;
                }
            }

            if (id === null) {
                var id = await APICtrl.createPlaylist(name);
            }

            APICtrl.addTracksToPlaylist(id, playlistURIs);
        } else {
            window.alert("Generate a playlist first!");
            // TODO: disable button
        }
    };

    /**
     * Updates the source type, ex. Playlist, Artist, etc.
     * Loads the necesary items for the source type.
     */
    const updateSourceType = async () => {
        sourceType = DOMInputs.selectSourceType.value;
        UICtrl.resetSourceItems();
        UICtrl.addSourceItem("Select...", "");

        const usesItem = [
            "Playlist",
            "Artist",
            "Artist (liked songs only)",
            "Genre (liked songs only)",
            "Decade (liked songs only)",
            "Key (liked songs only)",
            "Time signature (liked songs only)",
        ];
        sourceTypeUsesItem = usesItem.includes(sourceType);
        if (sourceTypeUsesItem) {
            $("#item_input_row").show();
            $("#range_input_row").hide();
        } else {
            UICtrl.resetRangeInputs();
            $("#item_input_row").hide();
            $("#range_input_row").show();
        }

        switch (sourceType) {
            case "Playlist":
                loadPlaylists();
                break;
            case "Artist":
                loadArtists();
                break;
            case "Artist (liked songs only)":
                await loadArtistsLikedSongs();
                break;
            case "Genre (liked songs only)":
                loadGenres();
                break;
            case "Decade (liked songs only)":
                loadDecades();
                break;
            case "Acousticness (liked songs only)":
                loadFeature("acousticness");
                break;
            case "Danceability (liked songs only)":
                loadFeature("danceability");
                break;
            case "Energy (liked songs only)":
                loadFeature("energy");
                break;
            case "Instrumentalness (liked songs only)":
                loadFeature("instrumentalness");
                break;
            case "Liveness (liked songs only)":
                loadFeature("liveness");
                break;
            case "Speechiness (liked songs only)":
                loadFeature("speechiness");
                break;
            case "Tempo (liked songs only)":
                loadFeature("tempo");
                break;
            case "Valence (liked songs only)":
                loadFeature("valence");
                break;
            case "Time signature (liked songs only)":
                loadTimeSignatures();
                break;
            case "Key (liked songs only)":
                loadKeys();
                break;
        }
    };

    const playGeneratedPlaylist = async () => {
        const playlistURIs = generatedPlaylist.map((a) => a.uri);
        var beepURI = "spotify:track:71a1rPBpAM5w8okBdlbbwU";
        await APICtrl.playURIS([...playlistURIs, beepURI]);
        clock = null;
        setTimeout(() => updateState(false), 500);
    };

    const updateState = async (runAgain = true) => {
        newState = await APICtrl.getPlaybackState();
        
        // Update state to be equal to new state, but keep the old timestamp
        state = {
            ...newState,
            timestamp: (state && state.timestamp) ? state.timestamp : newState.timestamp,
        };


        if (
            state !== null &&
            state.item != null &&
            UICtrl.isDisplayingTrack(state.item.id)
        ) {
            var isNewTrack = UICtrl.setCurrentTrack(state.item.id);
            if (isNewTrack) {
                // Update timestamp
                state.timestamp = newState.timestamp;
            }

            var currentProgress = Date.now() - state.timestamp;
            var reportedProgress = state.progress_ms;
            if (Math.abs(currentProgress - reportedProgress) > 3000) {
                console.log("Correcting progress: " + currentProgress);
                state.timestamp = Date.now() - state.progress_ms; // update timestamp to approximately when the song started playing
                state.corrected = true;
            }

            if (isNewTrack) {
                UICtrl.setTrackProgress(
                    Math.min(currentProgress, state.item.duration_ms).toHHMMSS()
                );
                if (
                    PlaylistGenerator.isFirstTrack(state.item.id) &&
                    clock !== null &&
                    !state.isPlaying &&
                    state.progress_ms === 0
                ) {
                    // playlist finished
                }
            }

            var trackTimeRemaining = state.item.duration_ms - currentProgress;


            if (!clockTimer) {
                clockTimer = setInterval(updateClock, updateClockInterval);
            }

            if (runAgain) {
                if (trackTimeRemaining < updateStateInterval) {
                    clearInterval(stateTimer);
                    setTimeout(() => {
                        updateState();
                        stateTimer = setInterval(
                            updateState,
                            updateStateInterval
                        );
                    }, trackTimeRemaining);
                }
            }
        } else {
            if (state === null || state.item === null) {
                UICtrl.setCurrentTrack(null);
            }
        }
    };

    const updateClock = async () => {
        var infoText =
            PlaylistGenerator.getNumTracks() +
            " songs, " +
            PlaylistGenerator.getDuration().toHHMMSS();

        if (state !== null && UICtrl.isDisplayingTrack(state.item.id)) {
            var currentProgress = state.is_playing
                ? Date.now() - state.timestamp
                : state.progress_ms;
            var timeRemaining = PlaylistGenerator.getTimeRemaining(
                state.item.id,
                currentProgress
            );
            var trackTimeRemaining = state.item.duration_ms - currentProgress;

            if (
                timeRemaining >= 0 &&
                (clock === null ||
                    Math.floor(timeRemaining / 1000) <
                        Math.floor(clock / 1000) ||
                    timeRemaining - clock > 2000)
            ) {
                // Clock should be updated!
                infoText +=
                    " (" + timeRemaining.toHHMMSS(false) + " remaining)";
                document.title =
                    "(" + timeRemaining.toHHMMSS(false) + ") " + originalTitle;
                clock = timeRemaining;
                UICtrl.setInfoText(infoText);
                UICtrl.setTrackProgress(
                    Math.min(currentProgress, state.item.duration_ms).toHHMMSS(
                        false
                    )
                );
            } else if (timeRemaining < 0) {
                UICtrl.setInfoText(infoText);
            }
        } else {
            if (PlaylistGenerator.getNumTracks() > 0) {
                UICtrl.setInfoText(infoText);
                document.title = originalTitle;
            }
            clock = null;
            clearInterval(clockTimer);
            clockTimer = null;
        }
    };

    DOMInputs.selectSourceType.addEventListener("change", async () => {
        await updateSourceType();
    });

    DOMInputs.selectSourceItem.addEventListener("change", async () => {
        sourceItem = DOMInputs.selectSourceItem.value;
        if (!loading) {
            updateTracklist();
        }
    });

    DOMInputs.featureMin.addEventListener("change", async () => {
        if (!loading) {
            updateTracklist();
        }
    });

    DOMInputs.featureMax.addEventListener("change", async () => {
        if (!loading) {
            updateTracklist();
        }
    });

    DOMInputs.save.addEventListener("click", async (e) => {
        await savePlaylist();
    });

    DOMInputs.regenerate.addEventListener("click", async (e) => {
        await generatePlaylist();
    });

    DOMInputs.shuffle.addEventListener("click", async (e) => {
        PlaylistGenerator.shufflePlaylist();
        UICtrl.resetTracks();
        generatedPlaylist.forEach((el, num) =>
            UICtrl.createTrack(
                el.id,
                num,
                el.name,
                el.artists.map((a) => a.name).join(", "),
                el.duration_ms
            )
        );
    });

    DOMInputs.play.addEventListener("click", async (e) => {
        e.preventDefault();
        playGeneratedPlaylist();
    });

    DOMInputs.login.addEventListener("click", function () {
        APICtrl.redirectToSpotifyAuthorizeEndpoint();
    });

    DOMInputs.logout.addEventListener("click", function () {
        APICtrl.logoutFromSpotify();
    });

    return {
        init() {
            start();
        },
    };
})(UIController, APIController, PlaylistGenerator);
