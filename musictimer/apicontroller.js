const APIController = (function () {
    const clientID = "09cea9a2db4742578a42d981c2582261";
    const redirectURI = "https://www.colintoft.com/musictimer/";
    // const redirectURI = "http://127.0.0.1:8080/";
    const scope =
        "user-read-private playlist-read-private playlist-read-collaborative user-modify-playback-state playlist-modify-public playlist-modify-private user-library-read user-follow-read user-read-playback-state";

    const stateKey = "spotify_auth_state";
    const loggedInKey = "has_logged_in";

    let accessToken = localStorage.getItem("access_token") || null;
    let refreshToken = localStorage.getItem("refresh_token") || null;
    let expiresAt = localStorage.getItem("expires_at") || null;

    let userID = null;

    var likedSongs = null;
    var hasLikedSongAlbumInfo = false;
    var hasLikedSongArtistInfo = false;
    var hasLikedSongFeatures = false;

    var isReloading = false;

    let keyNames = [
        "C minor",
        "C# minor",
        "D minor",
        "D# minor",
        "E minor",
        "F minor",
        "F# minor",
        "G minor",
        "G# minor",
        "A minor",
        "B♭ minor",
        "B minor",
        "C major",
        "D♭ major",
        "D major",
        "E♭ major",
        "E major",
        "F major",
        "F# major",
        "G major",
        "A♭ major",
        "A major",
        "B♭ major",
        "B major",
    ];

    async function generateCodeChallenge(codeVerifier) {
        const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(codeVerifier)
        );

        // Convert to base64 using Buffer
        // const base64 = Buffer.from(digest).toString("base64");

        const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }

    const _redirectToSpotifyAuthorizeEndpoint = async () => {
        const codeVerifier = generateRandomString(64);
        const code_challenge = await generateCodeChallenge(codeVerifier);
        window.localStorage.setItem("code_verifier", codeVerifier);

        // Redirect to example:
        // GET https://accounts.spotify.com/authorize?response_type=code&client_id=77e602fc63fa4b96acff255ed33428d3&redirect_uri=http%3A%2F%2Flocalhost&scope=user-follow-modify&state=e21392da45dbf4&code_challenge=KADwyz1X~HIdcAG20lnXitK6k51xBP4pEMEZHmCneHD1JhrcHjE1P3yU_NjhBz4TdhV6acGo16PCd10xLwMJJ4uCutQZHw&code_challenge_method=S256

        window.location = generateUrlWithSearchParams(
            "https://accounts.spotify.com/authorize",
            {
                response_type: "code",
                client_id: clientID,
                scope,
                code_challenge_method: "S256",
                code_challenge,
                redirect_uri: redirectURI,
            }
        );
        // If the user accepts spotify will come back to your application with the code in the response query string
        // Example: http://127.0.0.1:8080/?code=NApCCg..BkWtQ&state=profile%2Factivity
    };

    const exchangeToken = async (code) => {
        const code_verifier = localStorage.getItem("code_verifier");

        try {
            const response = await fetch(
                "https://accounts.spotify.com/api/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                    body: new URLSearchParams({
                        client_id: clientID,
                        grant_type: "authorization_code",
                        code,
                        redirect_uri: redirectURI,
                        code_verifier,
                    }),
                }
            );
            data = await addThrowErrorToFetch(response);
            await processTokenResponse(data);
            window.history.replaceState({}, document.title, "/");
        } catch (errObj) {
            showErrorAlert(errObj);
        }
    };

    const getNewToken = async () => {
        console.log("Token has expired, refreshing...");
        try {
            const reponse = await fetch(
                "https://accounts.spotify.com/api/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                    body: new URLSearchParams({
                        client_id: clientID,
                        grant_type: "refresh_token",
                        refresh_token: refreshToken,
                    }),
                }
            );
            const data = await addThrowErrorToFetch(reponse);
            await processTokenResponse(data);
        } catch (errObj) {
            // showErrorAlert(errObj);
            console.log(errObj);
            if (errObj.error === "invalid_grant") {
                console.log("Invalid grant, logging out...");
                _logout();
            } else {
                // showErrorAlert(errObj);
                console.error(errObj);
            }
        }
    };

    async function addThrowErrorToFetch(response) {
        if (response.status === 204) {
            // No Content, cannot read JSON body
            return {};
        } else if (response.ok) {
            return await response.json();
        } else {
            throw { response, error: (await response.json()).error };
        }
    }

    function _logout() {
        localStorage.clear();
        window.location.reload();
    }

    const processTokenResponse = async (data) => {
        console.log(data);

        accessToken = data.access_token;
        refreshToken = data.refresh_token;

        const t = new Date();
        expiresAt = t.setSeconds(t.getSeconds() + data.expires_in);

        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("expires_at", expiresAt);
    };

    const getUserData = async () => {
        try {
            const data = await makeAPIRequest("me", "GET");
            console.log("getting user data");
            console.log(data);
            $("login").hide();
            $("btn_logout").show();
            $("loggedin").show();

            if (data.product === "premium") {
                $("#btn_play").show();
                data.product = "Spotify Premium";
            } else {
                $("#btn_play").hide();
                data.product = "Spotify Free";
            }

            return data;
        } catch (errObj) {
            showErrorAlert(errObj);
            return null;
        }
    };

    function generateUrlWithSearchParams(url, params) {
        const urlObject = new URL(url);
        urlObject.search = new URLSearchParams(params).toString();

        return urlObject.toString();
    }

    /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
        var hashParams = {};
        var e,
            r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while ((e = r.exec(q))) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }

    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    function generateRandomString(length) {
        let text = "";
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        return text;
    }

    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function _loginToSpotify() {
        var state = generateRandomString(16);
        localStorage.setItem(stateKey, state);

        var url = "https://accounts.spotify.com/authorize";
        url += "?response_type=token";
        url += "&client_id=" + encodeURIComponent(clientID);
        url += "&scope=" + encodeURIComponent(scope);
        url += "&redirect_uri=" + encodeURIComponent(redirectURI);
        url += "&state=" + encodeURIComponent(state);

        localStorage.setItem(loggedInKey, true);

        window.location.href = url;
    }

    async function makeAPIRequest(url, method, body) {
        const URL_BASE = "https://api.spotify.com/v1/";

        // Check for expiration
        const t = new Date();
        if (t.getTime() > expiresAt) {
            await getNewToken();
            // TODO: handle errors here and reauthenticate
        }

        const headers = {
            Authorization: "Bearer " + accessToken,
        };
        if (method !== "GET") {
            headers["Content-Type"] = "application/json";
        }

        // Make the request
        // If it fails, we want to put it in an object so that we can access the error with errObj.error

        try {
            const response = await fetch(URL_BASE + url, {
                method,
                headers,
                body,
            });
            const data = await addThrowErrorToFetch(response);
            return data;
        } catch (errObj) {
            if (errObj.error.status === 401) {
                // Refresh token
                await getNewToken();

                // Try again
                return await makeAPIRequest(url, method, body);
            }
            // Rethrow if we get an error, to ensure we have the same format as the addThrowErrorToFetch function
            throw errObj;
        }
    }

    const showErrorAlert = (errObj) => {
        let error = errObj.error;
        console.error("Displaying error:");
        console.error(error);
        window.alert(
            "Error " +
                error.status +
                "\n" +
                error.statusText +
                "\n" +
                error.message
        );
    };

    /**
     * Initializes the API controller.
     * @returns {Promise} True if the user is logged in, false otherwise.
     */
    const _init = async () => {
        // If the user has accepted the authorize request spotify will come back to your application with the code in the response query string
        // Example: http://127.0.0.1:8080/?code=NApCCg..BkWtQ&state=profile%2Factivity
        const args = new URLSearchParams(window.location.search);
        const code = args.get("code");

        var userProfileSource = document.getElementById(
            "user-profile-template"
        ).innerHTML;
        var userProfileTemplate = Handlebars.compile(userProfileSource);
        var userProfilePlaceholder = document.getElementById("user-profile");

        if (code) {
            await exchangeToken(code);
        } else if (accessToken && refreshToken && expiresAt) {
            // Already have tokens in local storage
        } else {
            // we are not logged in so show the login button
            $("#login").show();
            $("#btn_logout").hide();
            $("#loggedin").hide();
            return false;
        }

        const data = await getUserData();
        document.getElementById("loggedin").style.display = "unset";
        $("#login").hide();
        $("#loggedin").show();

        userProfilePlaceholder.innerHTML = userProfileTemplate(data);
        userID = data.id;
        return true;
    };

    const _getMultipleItems = async (
        link,
        getData,
        maxOffset,
        updateInfoText,
        infoMessage
    ) => {
        try {
            var data = await makeAPIRequest(link, "GET");
        } catch (errObj) {
            if (errObj.error.status === 429) {
                retry = errObj.response.headers.get("Retry-After");
                await delay(retry * 1000 + 1000);
            } else {
                // Display error message
                showErrorAlert(errObj);
                return [];
            }
        }
        data = getData(data);
        var items = data.items;

        var timeToSend = new Date().getTime();
        var requestsAtATime = 100;
        var loweredRequestRate = false;

        sendRequest = async (initialDelay, requestOffset) => {
            await delay(initialDelay);
            let newLink = link + "&offset=" + requestOffset;
            try {
                var data = await makeAPIRequest(newLink, "GET");
                data = getData(data);
                items = items.concat(data.items);

                if (typeof updateInfoText !== "undefined") {
                    var percentComplete =
                        items.length /
                        data.limit /
                        Math.ceil(data.total / data.limit);
                    percentComplete = Math.round(percentComplete * 100);
                    updateInfoText(
                        infoMessage + "... (" + percentComplete + "%)"
                    );
                }
            } catch (errObj) {
                if (errObj.error.status === 429) {
                    retry = errObj.response.headers.get("Retry-After");
                    if (!loweredRequestRate) {
                        requestsAtATime = Math.round(requestsAtATime * 0.5);
                        loweredRequestRate = true;
                    }
                    // Try again
                    await sendRequest(retry * 1000 + 1000, requestOffset);
                } else {
                    // Display error message
                    showErrorAlert(errObj);
                    return null;
                }
            }
        };

        var offset = data.limit;

        while (offset < data.total && offset < maxOffset) {
            var promises = [];
            loweredRequestRate = false;

            for (var i = 0; i < requestsAtATime; i++) {
                var now = new Date().getTime();
                let delay = now >= timeToSend ? 0 : timeToSend - now;
                promises.push(sendRequest(delay, offset));

                offset += data.limit;
                if (offset >= data.total || offset >= maxOffset) break;
            }

            await Promise.allSettled(promises);
        }

        return items;
    };

    const _getUserPlaylists = async () => {
        return await _getMultipleItems(
            "users/" + userID + "/playlists?limit=50",
            (data) => data,
            100000
        );
    };

    const _getUserArtists = async () => {
        return await _getMultipleItems(
            "me/following?type=artist&limit=50",
            (data) => data.artists,
            49
        );
    };

    const _getMultipleItemsFromIDs = async (
        link,
        getItems,
        IDs,
        limit,
        updateInfoText,
        infoMessage
    ) => {
        var items = Array(IDs.length);
        var timeToSend = new Date().getTime();
        var requestsAtATime = 100;
        var loweredRequestRate = false;

        sendRequest = async (initialDelay, requestOffset) => {
            await delay(initialDelay);
            let newLink =
                link +
                "?ids=" +
                IDs.slice(requestOffset, requestOffset + limit).join(",");
            try {
                var data = await makeAPIRequest(newLink, "GET");
                let newItems = getItems(data);

                var args = [requestOffset, newItems.length].concat(newItems);
                Array.prototype.splice.apply(items, args);

                if (typeof updateInfoText !== "undefined") {
                    var percentComplete =
                        items.length / limit / Math.ceil(IDs.length / limit);
                    percentComplete = Math.round(percentComplete * 100);
                    updateInfoText(
                        infoMessage + "... (" + percentComplete + "%)"
                    );
                }
            } catch (errObj) {
                if (errObj.error.status === 429) {
                    retry = errObj.response.headers.get("Retry-After");
                    if (!loweredRequestRate) {
                        requestsAtATime = Math.round(requestsAtATime * 0.5);
                        loweredRequestRate = true;
                    }
                    // Try again
                    await sendRequest(retry * 1000 + 1000, requestOffset);
                } else {
                    // Display error message
                    showErrorAlert(errObj);
                    return null;
                }
            }
        };

        var offset = 0;

        while (offset < IDs.length) {
            var promises = [];
            loweredRequestRate = false;

            for (var i = 0; i < requestsAtATime; i++) {
                var now = new Date().getTime();

                let delay = now >= timeToSend ? 0 : timeToSend - now;
                promises.push(sendRequest(delay, offset));

                offset += limit;
                if (offset >= IDs.length) break;
            }

            await Promise.allSettled(promises);
        }

        return items;
    };

    const _getLikedSongAlbums = async (updateInfoText) => {
        if (hasLikedSongAlbumInfo) return;

        await _getLikedSongs(updateInfoText);

        updateInfoText("Loading song info...");

        var albumToSongDict = {};
        for (const song of likedSongs) {
            if (song.album.id in albumToSongDict) {
                albumToSongDict[song.album.id].push(song);
            } else {
                albumToSongDict[song.album.id] = [song];
            }
        }

        const albumIDs = Object.keys(albumToSongDict);
        var likedSongAlbums = await _getMultipleItemsFromIDs(
            "albums",
            (data) => data.albums,
            albumIDs,
            20,
            updateInfoText,
            "Loading song info"
        );

        for (const album of likedSongAlbums) {
            for (const song of albumToSongDict[album.id]) {
                song.album.genres = album.genres;
            }
        }

        hasLikedSongAlbumInfo = true;
    };

    const _getLikedSongArtists = async (updateInfoText) => {
        if (hasLikedSongArtistInfo) return;

        await _getLikedSongs(updateInfoText);

        updateInfoText("Searching for genres...");

        var artistToSongDict = {};
        for (const song of likedSongs) {
            if (song.artists[0].id in artistToSongDict) {
                artistToSongDict[song.artists[0].id].push(song);
            } else {
                artistToSongDict[song.artists[0].id] = [song];
            }
        }

        const artistIDs = Object.keys(artistToSongDict);
        var likedSongArtists = await _getMultipleItemsFromIDs(
            "artists",
            (data) => data.artists,
            artistIDs,
            50,
            updateInfoText,
            "Searching for genres"
        );

        for (const artist of likedSongArtists) {
            for (const song of artistToSongDict[artist.id]) {
                song.artists[0].genres = artist.genres;
            }
        }

        hasLikedSongArtistInfo = true;
    };

    const _getLikedSongFeatures = async (updateInfoText) => {
        if (hasLikedSongFeatures) return;

        await _getLikedSongs(updateInfoText);

        updateInfoText("Loading song info...");

        var likedSongIDs = likedSongs.map((song) => song.id);

        var likedSongFeatures = await _getMultipleItemsFromIDs(
            "audio-features",
            (data) => data.audio_features,
            likedSongIDs,
            100,
            updateInfoText,
            "Loading song info"
        );

        const features = [
            "acousticness",
            "danceability",
            "energy",
            "instrumentalness",
            "key",
            "liveness",
            "mode",
            "speechiness",
            "tempo",
            "time_signature",
            "valence",
        ];
        for (let song in likedSongFeatures) {
            if (likedSongFeatures[song] !== null) {
                for (const feature of features) {
                    likedSongs[song][feature] =
                        likedSongFeatures[song][feature];
                }
            }
        }

        hasLikedSongFeatures = true;
    };

    const _getUserGenres = async (updateInfoText) => {
        await _getLikedSongAlbums(updateInfoText);
        await _getLikedSongArtists(updateInfoText);

        updateInfoText("Loading genres...");

        var genres = new Set();

        for (const song of likedSongs) {
            if (song.album.genres.length > 0) {
                song.album.genres.forEach((genre) => genres.add(genre));
            } else if (song.artists[0].genres.length > 0) {
                song.artists[0].genres.forEach((genre) => genres.add(genre));
            }
        }

        return [...genres];
    };

    const _getUserDecades = async (updateInfoText) => {
        await _getLikedSongs(updateInfoText);

        updateInfoText("Loading decades...");
        var decades = new Set();
        var year;
        for (const song of likedSongs) {
            year = parseInt(song.album.release_date.substring(0, 4));
            decades.add(Math.floor(year / 10) * 10);
        }

        return [...decades].map((y) => y + "s");
    };

    const _getUserKeys = async (updateInfoText) => {
        await _getLikedSongFeatures(updateInfoText);

        updateInfoText("Loading keys...");
        var keys = new Set();
        var key;
        for (const song of likedSongs) {
            key = song.key;
            if (song.mode === 1) {
                key += 12;
            }
            keys.add(key);
            if (keys.size === 24) break;
        }

        return [...keys].sort().map((k) => keyNames[k]);
    };

    const _getUserTimeSignatures = async (updateInfoText) => {
        await _getLikedSongFeatures(updateInfoText);

        updateInfoText("Loading time signatures...");
        var timeSignatures = new Set();
        var timeSignature;
        for (const song of likedSongs) {
            timeSignatures.add(song.time_signature);
        }

        // Remove undefined from the set
        timeSignatures.delete(undefined);

        return [...timeSignatures].sort();
    };

    const _getLikedSongsWithGenre = async (genre, updateInfoText) => {
        await _getLikedSongAlbums(updateInfoText);

        updateInfoText("Finding " + genre + " songs...");

        var songs = likedSongs.filter(
            (song) =>
                song.album.genres.includes(genre) ||
                song.artists[0].genres.includes(genre)
        );
        return songs;
    };

    const _getLikedSongsFromDecade = async (decade, updateInfoText) => {
        await _getLikedSongs(updateInfoText);

        const yearMin = parseInt(decade.substring(0, 4));
        const yearMax = yearMin + 9;

        return likedSongs.filter((song) => {
            var year = parseInt(song.album.release_date.substring(0, 4));
            return yearMin <= year && year <= yearMax;
        });
    };

    const _getLikedSongsWithFeature = async (
        feature,
        min,
        max,
        updateInfoText
    ) => {
        await _getLikedSongFeatures(updateInfoText);

        if (Number.isNaN(max)) max = Infinity;
        if (Number.isNaN(min)) min = -Infinity;

        return likedSongs.filter(
            (song) =>
                song.hasOwnProperty(feature) &&
                min <= song[feature] &&
                song[feature] <= max
        );
    };

    const _getLikedSongsWithKey = async (ken, key, updateInfoText) => {
        await _getLikedSongFeatures(updateInfoText);
        var mode = key.endsWith("major");
        var key = keyNames.indexOf(key) % 12;

        return likedSongs.filter((song) => {
            return song.key == key && song.mode == mode;
        });
    };

    const _getLikedSongs = async (updateInfoText) => {
        if (likedSongs !== null) {
            return likedSongs;
        }

        var tracks = await _getMultipleItems(
            "me/tracks?limit=50",
            (data) => data,
            Infinity,
            updateInfoText,
            "Loading liked songs"
        );

        likedSongs = tracks.map((a) => a.track);
        likedSongs = likedSongs.filter((track, index) =>
            tracks
                .slice(0, index)
                .every(
                    (e) =>
                        !(
                            e.name === track.name &&
                            e.artists[0].name === track.artists[0].name
                        )
                )
        );
        return likedSongs;
    };

    const _getTracksFromPlaylist = async (playlistID, updateInfoText) => {
        if (playlistID === "liked songs")
            return await _getLikedSongs(updateInfoText);

        var tracks = await _getMultipleItems(
            "playlists/" + playlistID + "/tracks?limit=100",
            (data) => data,
            100000,
            updateInfoText,
            "Loading tracks"
        );

        return tracks.map((a) => a.track);
    };

    const _getTracksFromArtist = async (artistName, updateInfoText) => {
        var tracks = await _getMultipleItems(
            "search?type=track&limit=50&q=artist:" + artistName,
            (data) => data.tracks,
            1000,
            updateInfoText,
            "Loading tracks"
        );

        tracks = tracks.filter((track) =>
            track.artists.some((e) => e.name === artistName)
        );

        return tracks.filter((track, index) =>
            tracks.slice(0, index).every((e) => e.name !== track.name)
        );
    };

    const _getLikedTracksFromArtist = async (artistID, updateInfoText) => {
        await _getLikedSongs(updateInfoText);

        updateInfoText("Finding liked tracks by artist...");

        tracks = likedSongs.filter((track) =>
            track.artists.some((e) => e.id === artistID)
        );

        return tracks.filter((track, index) =>
            tracks.slice(0, index).every((e) => e.name !== track.name)
        );
    };

    const _playURIS = async (uris) => {
        // First, turn off shuffle
        var notified = false;
        try {
            const data = await makeAPIRequest(
                "me/player/shuffle?state=false",
                "PUT"
            );
        } catch (errObj) {
            if (errObj.error.status === 404) {
                window.alert(
                    "No active device found. Open Spotify so we can find your device! You may need to start playing music first."
                );
            } else {
                showErrorAlert(errObj);
            }
            notified = true;
        }

        // Then, play the URIs
        try {
            await makeAPIRequest(
                "me/player/play",
                "PUT",
                JSON.stringify({ uris })
            );
        } catch (errObj) {
            if (errObj.error.status === 404) {
                window.alert(
                    "No active device found. Open Spotify so we can find your device! You may need to start playing music first."
                );
            } else {
                showErrorAlert(errObj);
            }
        }
    };

    const _createPlaylist = async (playlistName) => {
        try {
            const data = await makeAPIRequest(
                "users/" + userID + "/playlists",
                "POST",
                JSON.stringify({
                    name: playlistName,
                    description:
                        "Created with Spotify Music Timer (www.colintoft.com/musictimer)",
                    public: false,
                })
            );
            return data.id;
        } catch (errObj) {
            showErrorAlert(errObj);
        }
    };

    const _addTracksToPlaylist = async (playlistID, uris) => {
        var data;

        const limit = 100;

        for (var offset = 0; offset < uris.length; offset += limit) {
            try {
                data = await makeAPIRequest(
                    "playlists/" + playlistID + "/tracks",
                    "POST",
                    JSON.stringify({
                        uris: uris.slice(offset, offset + limit),
                    })
                );
            } catch (errObj) {
                showErrorAlert(errObj);
            }
        }
    };

    const _getPlaybackState = async () => {
        try {
            const data = await makeAPIRequest("me/player", "GET");
            return data == {} ? null : data;
        } catch (errObj) {
            if (errObj.error.status === 429) {
                // Rate limit exceeded, this method is on a timer anyway so it will be called again
            } else if (errObj.error.status === 500) {
                // Internal server error, this method is on a timer anyway so it will be called again
            } else {
                showErrorAlert(errObj);
            }
            return null;
        }
    };

    return {
        init() {
            return _init();
        },
        redirectToSpotifyAuthorizeEndpoint() {
            return _redirectToSpotifyAuthorizeEndpoint();
        },

        getLikedSongs(updateInfoText) {
            return _getLikedSongs(updateInfoText);
        },
        getLikedSongFeatures(updateInfoText) {
            return _getLikedSongFeatures(updateInfoText);
        },
        getUserPlaylists(userID) {
            return _getUserPlaylists(userID);
        },
        getUserArtists() {
            return _getUserArtists();
        },
        getTracksFromPlaylist(playlistID, updateInfoText) {
            return _getTracksFromPlaylist(playlistID, updateInfoText);
        },
        getTracksFromArtist(artistName, updateInfoText) {
            return _getTracksFromArtist(artistName, updateInfoText);
        },
        getLikedTracksFromArtist(artistID, updateInfoText) {
            return _getLikedTracksFromArtist(artistID, updateInfoText);
        },
        getUserGenres(updateInfoText) {
            return _getUserGenres(updateInfoText);
        },
        getLikedSongsWithGenre(genre, updateInfoText) {
            return _getLikedSongsWithGenre(genre, updateInfoText);
        },
        getUserDecades(updateInfoText) {
            return _getUserDecades(updateInfoText);
        },
        getUserKeys(updateInfoText) {
            return _getUserKeys(updateInfoText);
        },
        getUserTimeSignatures(updateInfoText) {
            return _getUserTimeSignatures(updateInfoText);
        },
        getLikedSongsFromDecade(decade, updateInfoText) {
            return _getLikedSongsFromDecade(decade, updateInfoText);
        },
        getLikedSongsWithKey(key, updateInfoText) {
            return _getLikedSongsWithKey(key, updateInfoText);
        },
        getLikedSongsWithFeature(feature, min, max, updateInfoText) {
            return _getLikedSongsWithFeature(feature, min, max, updateInfoText);
        },
        hasLikedSongs() {
            return likedSongs !== null;
        },
        hasLikedSongFeatures() {
            return hasLikedSongFeatures;
        },
        hasLikedSongGenres() {
            return hasLikedSongAlbumInfo && hasLikedSongArtistInfo;
        },
        playURIS(uris) {
            _playURIS(uris);
        },
        createPlaylist(name) {
            return _createPlaylist(name);
        },
        addTracksToPlaylist(playlistID, uris) {
            _addTracksToPlaylist(playlistID, uris);
        },
        getPlaybackState() {
            return _getPlaybackState();
        },
        loginToSpotify() {
            _loginToSpotify();
        },
        logoutFromSpotify() {
            _logout();
        },
    };
})();
