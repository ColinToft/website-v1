Number.prototype.toHHMMSS = function (round = true) {
    
    var ms;
    if (round) {
        ms = Math.round(this.valueOf() / 1000) * 1000;
    } else {
        ms = Math.floor(this.valueOf() / 1000) * 1000;
    }
    
    var hours   = Math.floor(ms / 3600000);
    var minutes = Math.floor((ms - (hours * 3600000)) / 60000);
    var seconds = Math.floor((ms - (hours * 3600000) - (minutes * 60000)) / 1000);
        
    if (minutes < 10 && hours > 0) {minutes = "0"+minutes;}
    if (hours === 0) hours = "";
    else { hours = hours + ":"; }
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+minutes+':'+seconds;
}

String.prototype.titleCase = function () {
  return this.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}

const APIController = (function() {
    const clientID = '09cea9a2db4742578a42d981c2582261';
    const redirectURI = 'https://www.colintoft.com/musictimer/';
    const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-modify-playback-state playlist-modify-public playlist-modify-private user-library-read user-follow-read user-read-playback-state';
    
    const stateKey = 'spotify_auth_state';
    const loggedInKey = 'has_logged_in';
    
    var likedSongs = null;
    var hasLikedSongAlbumInfo = false;
    var hasLikedSongArtistInfo = false;
    var hasLikedSongFeatures = false;
    
    var isReloading = false;
    
    let keyNames = ["C minor", "C# minor", "D minor", "D# minor", "E minor", "F minor", "F# minor", "G minor", "G# minor", "A minor", "B♭ minor", "B minor", "C major", "D♭ major", "D major", "E♭ major", "E major", "F major", "F# major", "G major", "A♭ major", "A major", "B♭ major", "B major"];

    /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
          q = window.location.hash.substring(1);
        while ( e = r.exec(q)) {
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
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
    
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function _loginToSpotify() {
        var state = generateRandomString(16);
        localStorage.setItem(stateKey, state);
        
        var url = 'https://accounts.spotify.com/authorize';
        url += '?response_type=token';
        url += '&client_id=' + encodeURIComponent(clientID);
        url += '&scope=' + encodeURIComponent(scope);
        url += '&redirect_uri=' + encodeURIComponent(redirectURI);
        url += '&state=' + encodeURIComponent(state);
        
        localStorage.setItem(loggedInKey, true);

        window.location.href = url;
    }
    
    function _checkForResponseError(response, alert = true) {
        if (!response.ok) {
            if (alert) {
                window.alert("Response Error " + response.status + "\n" + response.statusText);
            }
            return true;
        }
        return false;
    }
    
    function _checkForError(data, alert = true) {
        if (data.hasOwnProperty("error")) {
            if (data.error.message === "The access token expired") {
                if (!isReloading) {
                    isReloading = true;
                    window.alert("Your session has expired. Press OK to reload the page.");
                    window.location.href = redirectURI;
                }
                return true;
            }
            else if (alert) {
                window.alert("Error " + data.error.status + "\n" + data.error.message);
            }
            return true;
        }
        return false;
    }
    
    const _getTokenAndUserID = async () => {
        var userProfileSource = document.getElementById('user-profile-template').innerHTML;
        var userProfileTemplate = Handlebars.compile(userProfileSource);
        var userProfilePlaceholder = document.getElementById('user-profile');
        var oauthSource = document.getElementById('oauth-template').innerHTML;
        var oauthTemplate = Handlebars.compile(oauthSource);
        var oauthPlaceholder = document.getElementById('oauth');

        var params = getHashParams();

        var access_token = params.access_token;
        var state = params.state;
        var storedState = localStorage.getItem(stateKey);

        if (access_token && (state === null || state !== storedState)) {
            window.location.href = redirectURI;
        } else {
            localStorage.removeItem(stateKey);
            if (access_token) {
                /* const result = await fetch('https://api.spotify.com/v1/me', {
                    method: 'GET',
                    headers: {'Authorization': 'Bearer ' + access_token}
                }); */
                const result = await fetch('https://api.spotify.com/v1/me', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + access_token           
                     }
                });
                
                console.log("v1/me received result:");
                console.log(result);
                // _checkForResponseError(result, alert = true);
               
                const data = await result.json();
                
                if (data.product === "premium") {
                    $('#btn_play').show();
                    data.product = "Spotify Premium";
                } else {
                    $('#btn_play').hide();
                    data.product = "Spotify Free";
                }
                
                userProfilePlaceholder.innerHTML = userProfileTemplate(data);
                                
                $('#login').hide();
                $('#loggedin').show();
                
                return {
                    token: access_token,
                    userID: data.id
                };
                
                /*$.ajax({
                    url: 'https://api.spotify.com/v1/me',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    success: function(response) {
                        userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                        clientID = response.id;

                        $('#login').hide();
                        $('#loggedin').show();
                    }
                });*/

                
            } else {
                if (localStorage.getItem(loggedInKey)) {
                    $('#login').hide();
                    $('#loggedin').show();
                    _loginToSpotify();
                } else {
                    $('#login').show();
                    $('#loggedin').hide();
                }
            }
        }
        
        return {
            token: null,
            userID: null
        };
    }
    
    const _getMultipleItems = async (token, link, getData, updateInfoText, infoMessage) => {
        var result = await fetch(link, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token}
        });
        
        var data = await result.json();
        while (_checkForError(data, false)) {
            if (data.error.status === 429) {
                retry = result.headers.get("Retry-After");
                await delay(retry * 1000 + 1000);
            } else {
                _checkForError(data);
                return [];
            }
        }
        data = getData(data);
        var items = data.items;
        
        var timeToSend = (new Date()).getTime();
        var requestsAtATime = 100;
        var loweredRequestRate = false;

        sendRequest = async (requestOffset) => {
            await fetch(link + "&offset=" + requestOffset, {
                method: 'GET',
                headers: {'Authorization': 'Bearer ' + token}
            }).then(async (newResult) => {
                if (_checkForResponseError(newResult, false)) {
                    if (newResult.status === 503) {
                        console.log("got 503");
                        await sendRequest(requestOffset);
                    } else if (newResult.status === 429) {
                        retry = newResult.headers.get("Retry-After");
                        timeToSend = (new Date()).getTime() + retry * 1000 + 1000;
                        if (!loweredRequestRate) {
                            requestsAtATime = Math.round(requestsAtATime * 0.5);
                            loweredRequestRate = true;
                        }
                        await delay(retry * 1000 + 1000).then(() => sendRequest(requestOffset));
                    } else {
                        console.log("got another error: " + newResult.status);
                        _checkForResponseError(newResult);
                    }
                } else {
                    newData = await newResult.json();
                    if (_checkForError(newData, false)) {
                        if (newData.error.status === 429) {
                            retry = newResult.headers.get("Retry-After");
                            timeToSend = (new Date()).getTime() + retry * 1000 + 1000;
                            if (!loweredRequestRate) {
                                requestsAtATime = Math.round(requestsAtATime * 0.5);
                                loweredRequestRate = true;
                            }
                            await delay(retry * 1000 + 1000).then(() => sendRequest(requestOffset));

                        } else {
                            _checkForError(newData);
                        }
                    } else {
                        newData = getData(newData);
                        items = items.concat(newData.items);
                        if (typeof updateInfoText !== "undefined") {
                            var percentComplete = items.length / data.limit / Math.ceil(data.total / data.limit);
                            percentComplete = Math.round(percentComplete * 100);
                            updateInfoText(infoMessage + "... (" + percentComplete + "%)");
                        }
                    }
                }
            });
        };

        var offset = data.limit;
        
        while (offset < data.total) {
            var promises = [];
            loweredRequestRate = false;
            
            for (var i = 0; i < requestsAtATime; i++) {
                var now = (new Date()).getTime();
                if (now >= timeToSend) {
                    promises.push(sendRequest(offset));
                } else {
                    promises.push(delay(timeToSend - now).then(() => sendRequest(offset)));
                }
                
                offset += data.limit;
                if (offset >= data.total) break;
            }
            
            await Promise.allSettled(promises);
        }
                        
        return items;
    }
    
    const _getUserPlaylists = async (token, userID) => {        
        return await _getMultipleItems(token, 'https://api.spotify.com/v1/users/' + userID + '/playlists?limit=50', (d) => d);
    }
    
    const _getUserArtists = async (token) => {        
        return await _getMultipleItems(token, 'https://api.spotify.com/v1/me/following?type=artist&limit=50', (d) => d.artists);
    }
    
    const _getMultipleItemsFromIDs = async (token, link, getItems, IDs, limit, updateInfoText, infoMessage) => {
        var items = Array(IDs.length);
        var timeToSend = (new Date()).getTime();
        var requestsAtATime = 100;
        var loweredRequestRate = false;

        sendRequest = async (requestOffset) => {
            await fetch(link + "?ids=" + IDs.slice(requestOffset, requestOffset + limit).join(","), {
                method: 'GET',
                headers: {'Authorization': 'Bearer ' + token}
            }).then(async (newResult) => {
                if (_checkForResponseError(newResult, false)) {
                    if (newResult.status === 503) {
                        console.log("got 503");
                        await sendRequest(requestOffset);
                    } else if (newResult.status === 429) {
                        console.log("got 429 in IDs at offset " + requestOffset);
                        retry = newResult.headers.get("Retry-After");
                        timeToSend = (new Date()).getTime() + retry * 1000 + 1000;
                        if (!loweredRequestRate) {
                            requestsAtATime = Math.round(requestsAtATime * 0.5);
                            loweredRequestRate = true;
                        }
                        await delay(retry * 1000 + 1000).then(() => sendRequest(requestOffset));
                    } else {
                        console.log("got another error in IDs: " + newResult.status);
                        _checkForResponseError(newResult);
                    }
                } else {
                
                    newData = await newResult.json();

                    if (_checkForError(newData, false)) {
                        if (newData.error.status === 429) {
                            retry = newResult.headers.get("Retry-After");
                            timeToSend = (new Date()).getTime() + retry * 1000 + 1000;
                            if (!loweredRequestRate) {
                                requestsAtATime = Math.round(requestsAtATime * 0.5);
                                loweredRequestRate = true;
                            }
                            await delay(retry * 1000 + 1000).then(() => sendRequest(requestOffset));
                        } else {
                            _checkForError(newData);
                        }
                    } else {
                        var newItems = getItems(newData);
                        var args = [requestOffset, newItems.length].concat(newItems);
                        Array.prototype.splice.apply(items, args);
                        
                        if (typeof updateInfoText !== "undefined") {
                            var percentComplete = items.length / limit / Math.ceil(IDs.length / limit);
                            percentComplete = Math.round(percentComplete * 100);
                            updateInfoText(infoMessage + "... (" + percentComplete + "%)");
                        }
                    }
                }
            }).catch((error) => console.log("oops: " + error));
        };

        var offset = 0;
        
        while (offset < IDs.length) {
            var promises = [];
            loweredRequestRate = false;
            
            for (var i = 0; i < requestsAtATime; i++) {
                var now = (new Date()).getTime();
                if (now >= timeToSend) {
                    promises.push(sendRequest(offset));
                } else {
                    promises.push(delay(timeToSend - now).then(() => sendRequest(offset)));
                }
                
                offset += limit;
                if (offset >= IDs.length) break;
            }
            
            await Promise.allSettled(promises);
        }
        
        return items;
    }
    
    const _getLikedSongAlbums = async (token, updateInfoText) => {
        if (hasLikedSongAlbumInfo) return;
        
        await _getLikedSongs(token, updateInfoText);
        
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
        var likedSongAlbums = await _getMultipleItemsFromIDs(token, "https://api.spotify.com/v1/albums", 
            (d) => d.albums, albumIDs, 20, updateInfoText, "Loading song info");
        
        for (const album of likedSongAlbums) {
            for (const song of albumToSongDict[album.id]) {
                song.album.genres = album.genres;
            }
        }
        
        hasLikedSongAlbumInfo = true;
    }
    
    const _getLikedSongArtists = async (token, updateInfoText) => {
        if (hasLikedSongArtistInfo) return;
        
        await _getLikedSongs(token, updateInfoText);
        
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
        var likedSongArtists = await _getMultipleItemsFromIDs(token, "https://api.spotify.com/v1/artists", 
            (d) => d.artists, artistIDs, 50, updateInfoText, "Searching for genres");
        
        for (const artist of likedSongArtists) {
            for (const song of artistToSongDict[artist.id]) {
                song.artists[0].genres = artist.genres;
            }
        }
        
        hasLikedSongArtistInfo = true;
    }
    
    const _getLikedSongFeatures = async (token, updateInfoText) => {
        if (hasLikedSongFeatures) return;
        
        await _getLikedSongs(token, updateInfoText);
        
        updateInfoText("Loading song info...");
                
        var likedSongIDs = likedSongs.map((song) => song.id);
        
        var likedSongFeatures = await _getMultipleItemsFromIDs(token, "https://api.spotify.com/v1/audio-features", 
            (d) => d.audio_features, likedSongIDs, 100, updateInfoText, "Loading song info");

        
        const features = ["acousticness", "danceability", "energy", "instrumentalness", "key", "liveness", "mode", "speechiness", "tempo", "time_signature", "valence"];
        for (let song in likedSongFeatures) {
            if (likedSongFeatures[song] !== null) {
                for (const feature of features) {
                    likedSongs[song][feature] = likedSongFeatures[song][feature];
                }
            }
        }
        
        hasLikedSongFeatures = true;
    }
    
    const _getUserGenres = async (token, updateInfoText) => {
        await _getLikedSongAlbums(token, updateInfoText);
        await _getLikedSongArtists(token, updateInfoText);
        
        updateInfoText("Loading genres...");
        
        var genres = new Set();
        
        for (const song of likedSongs) {
            if (song.album.genres.length > 0) {
                song.album.genres.forEach(genre => genres.add(genre));
            } else if (song.artists[0].genres.length > 0) {
                song.artists[0].genres.forEach(genre => genres.add(genre));
            }
        }
        
        return [...genres];
    }
    
    const _getUserDecades = async (token, updateInfoText) => {
        await _getLikedSongs(token, updateInfoText);
        
        updateInfoText("Loading decades...");
        var decades = new Set();
        var year;
        for (const song of likedSongs) {
            year = parseInt(song.album.release_date.substring(0, 4));
            decades.add(Math.floor(year / 10) * 10);
        }
        
        return [...decades].map((y) => y + "s");
    }
    
    const _getUserKeys = async (token, updateInfoText) => {
        await _getLikedSongFeatures(token, updateInfoText);
        
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
    }
    
    const _getUserTimeSignatures = async (token, updateInfoText) => {
        await _getLikedSongFeatures(token, updateInfoText);
        
        updateInfoText("Loading time signatures...");
        var timeSignatures = new Set();
        var timeSignature;
        for (const song of likedSongs) {
            timeSignatures.add(song.time_signature);
        }
        
        return [...timeSignatures].sort();
    }
    
    const _getLikedSongsWithGenre = async (token, genre, updateInfoText) => {
        await _getLikedSongAlbums(token, updateInfoText);
        
        updateInfoText("Finding " + genre + " songs...");
        
        var songs = likedSongs.filter((song) => song.album.genres.includes(genre) || song.artists[0].genres.includes(genre));
        return songs;
    }
    
    const _getLikedSongsFromDecade = async (token, decade, updateInfoText) => {
        await _getLikedSongs(token, updateInfoText);
        
        const yearMin = parseInt(decade.substring(0, 4));
        const yearMax = yearMin + 9;
        
        return likedSongs.filter((song) => {
            var year = parseInt(song.album.release_date.substring(0, 4));
            return yearMin <= year && year <= yearMax;
        })
    }
    
    const _getLikedSongsWithFeature = async (token, feature, min, max, updateInfoText) => {
        await _getLikedSongFeatures(token, updateInfoText);
        
        if (Number.isNaN(max)) max = Infinity;
        if (Number.isNaN(min)) min = -Infinity;
                
        return likedSongs.filter((song) => song.hasOwnProperty(feature) && min <= song[feature] && song[feature] <= max);
    }
    
    const _getLikedSongsWithKey = async (token, key, updateInfoText) => {
        await _getLikedSongFeatures(token, updateInfoText);   
        var mode = key.endsWith("major");
        var key = keyNames.indexOf(key) % 12;

        return likedSongs.filter((song) => {
            return song.key == key && song.mode == mode;
        });
    }
    
    const _getLikedSongs = async (token, updateInfoText) => {
        if (likedSongs !== null) {
            return likedSongs;
        }
        
        var tracks = await _getMultipleItems(token, "https://api.spotify.com/v1/me/tracks?limit=50",
                                             (d) => d, updateInfoText, "Loading liked songs");
            
        likedSongs = tracks.map(a => a.track);
        likedSongs = likedSongs.filter((track, index) => tracks.slice(0, index).every((e) => !(e.name === track.name && e.artists[0].name === track.artists[0].name)));
        return likedSongs;
    }
    
    const _getTracksFromPlaylist = async (token, playlistID, updateInfoText) => {
        
        if (playlistID === "liked songs") return await _getLikedSongs(token, updateInfoText);
        
        var tracks = await _getMultipleItems(token, 'https://api.spotify.com/v1/playlists/' + playlistID + '/tracks?limit=100',
            (d) => d, updateInfoText, "Loading tracks");
                
        return tracks.map(a => a.track);
    }
    
    const _getTracksFromArtist = async (token, artistName, updateInfoText) => {
        var tracks = await _getMultipleItems(token, 'https://api.spotify.com/v1/search?type=track&limit=50&q=artist:' + artistName,
            (d) => d.tracks, updateInfoText, "Loading tracks");
        
        tracks = tracks.filter(track => track.artists.some((e) => e.name === artistName));
        
        return tracks.filter((track, index) => tracks.slice(0, index).every((e) => e.name !== track.name));
    }
    
    const _getLikedTracksFromArtist = async (token, artistID, updateInfoText) => {   
        await _getLikedSongs(token, updateInfoText);
        
        updateInfoText("Finding liked tracks by artist...");
        
        tracks = likedSongs.filter(track => track.artists.some((e) => e.id === artistID));
        
        return tracks.filter((track, index) => tracks.slice(0, index).every((e) => e.name !== track.name));
    }
    
    const _playURIS = async(token, uris) => {
        // First, turn off shuffle
        const result = await fetch('https://api.spotify.com/v1/me/player/shuffle?state=false', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
            /*,
            body: JSON.stringify({
                'state': false
            })*/
        });
        
        var notified = false;
        if (_checkForResponseError(result, false)) {
            if (result.status !== 404) {
                _checkForResponseError(result);
            } else {
                window.alert("No active device found. Open Spotify so we can find your device!");
                notified = true;
            }
        };
        
        const result2 = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'uris': uris
            })
        });
        
        if (_checkForResponseError(result2, false)) {
            if (result.status !== 404) {
                _checkForResponseError(result2);
            } else {
                if (!notified) {
                    window.alert("No active device found. Open Spotify so we can find your device!");
                }
            }
        };
    }
    
    const _createPlaylist = async (token, userID, playlistName) => {
        var result = await fetch('https://api.spotify.com/v1/users/' + userID + '/playlists', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'name': playlistName,
                'description': 'Created with Spotify Music Timer (www.colintoft.com/musictimer)',
                'public': false
            })
        });
        
        var data = await result.json();
        _checkForError(data);
        
        return data.id;
    }
    
    const _addTracksToPlaylist = async (token, playlistID, uris) => {
        var data;
        
        const limit = 100;
        
        for (var offset = 0; offset < uris.length; offset += limit) {
    
            result = await fetch('https://api.spotify.com/v1/playlists/' + playlistID + '/tracks', {
                method: offset === 0 ? 'PUT' : 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'uris': uris.slice(offset, offset + limit)
                })
            });
            
            data = await result.json();
            _checkForError(data);
        }
    }
    
    const _getPlaybackState = async(token) => {
        const result = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token}
        });
                
        if (_checkForError(result, false) || result.status === 204 || result.status === 400 || result.status === 429) {
            return null;
        }
        
        const state = await result.json();
        
        _checkForError(state);
        
        return state;
    }
    
    return {
        getTokenAndUserID() {
            return _getTokenAndUserID();
        },
        getLikedSongs(token, updateInfoText) {
            return _getLikedSongs(token, updateInfoText);
        },
        getLikedSongFeatures(token, updateInfoText) {
            return _getLikedSongFeatures(token, updateInfoText);
        },
        getUserPlaylists(token, userID) {
            return _getUserPlaylists(token, userID);
        },
        getUserArtists(token) {
            return _getUserArtists(token);
        },
        getTracksFromPlaylist(token, playlistID, updateInfoText) {
            return _getTracksFromPlaylist(token, playlistID, updateInfoText);
        },
        getTracksFromArtist(token, artistName, updateInfoText) {
            return _getTracksFromArtist(token, artistName, updateInfoText);
        },
        getLikedTracksFromArtist(token, artistID, updateInfoText) {
            return _getLikedTracksFromArtist(token, artistID, updateInfoText);
        },
        getUserGenres(token, updateInfoText) {
            return _getUserGenres(token, updateInfoText);
        },
        getLikedSongsWithGenre(token, genre, updateInfoText) {
            return _getLikedSongsWithGenre(token, genre, updateInfoText);
        },
        getUserDecades(token, updateInfoText) {
            return _getUserDecades(token, updateInfoText);
        },
        getUserKeys(token, updateInfoText) {
            return _getUserKeys(token, updateInfoText);
        },
        getUserTimeSignatures(token, updateInfoText) {
            return _getUserTimeSignatures(token, updateInfoText);
        },
        getLikedSongsFromDecade(token, decade, updateInfoText) {
            return _getLikedSongsFromDecade(token, decade, updateInfoText);
        },
        getLikedSongsWithKey(token, key, updateInfoText) {
            return _getLikedSongsWithKey(token, key, updateInfoText);
        },
        getLikedSongsWithFeature(token, feature, min, max, updateInfoText) {
            return _getLikedSongsWithFeature(token, feature, min, max, updateInfoText);
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
        playURIS(token, uris) {
            _playURIS(token, uris);
        },
        createPlaylist(token, userID, name) {
            return _createPlaylist(token, userID, name);
        },
        addTracksToPlaylist(token, playlistID, uris) {
            _addTracksToPlaylist(token, playlistID, uris);
        },
        getPlaybackState(token) {
            return _getPlaybackState(token);
        },
        loginToSpotify() {
            _loginToSpotify();
        }
    }
    
})();

const UIController = (function() {
    
    const DOMElements = {
        lengthH: '#h',
        lengthM: '#m',
        lengthS: '#s',
        lengthRange: '#lengthRange',
        minSongLengthM: '#minSongLengthM',
        minSongLengthS: '#minSongLengthS',
        maxSongLengthM: '#maxSongLengthM',
        maxSongLengthS: '#maxSongLengthS',
        minTracks: '#minTracks',
        maxTracks: '#maxTracks',
        selectSourceType: '#select_source_type',
        selectSourceItem: '#select_source_item',
        itemInputPrompt: '#item_input_prompt',
        rangeInputPrompt: '#range_input_prompt',
        info: '#info',
        featureMin: '#feature_min',
        featureMax: '#feature_max',
        buttonPlay: '#btn_play',
        buttonSave: '#btn_save',
        buttonRegenerate: '#btn_regenerate',
        buttonShuffle: '#btn_shuffle',
        buttonLogin: '#btn_login',
        divSongList: '.song-list',
        trackClass: '.list-group-item',
        hfToken: '#hidden_token'
    }

    var currentTrack = null;

    var backgroundOpacity = 1.0;
    
    function _boldTrack(id) {
        if (document.getElementById(id) !== null) { 
            document.getElementById(id).style.backgroundColor = '#e0e0e0';
            document.getElementById(id).style.fontWeight = 500;
            document.getElementById(id).style.color = '#000000';
        }
    }
    
    function _unBoldTrack(id) {
        if (document.getElementById(id) !== null) { 
            document.getElementById(id).style.backgroundColor = null;
            document.getElementById(id).style.fontWeight = null;
            document.getElementById(id).style.color = null;
            
            var t = document.getElementById(id).innerHTML;
            if (t.lastIndexOf("/") !== -1 && t.lastIndexOf("/") > t.lastIndexOf("(")) {
                t = t.substr(0, t.lastIndexOf("(") + 1) + t.substr(t.lastIndexOf("/") + 1);
            }
            document.getElementById(id).innerHTML = t;
        }
    }
    
    function _setCurrentTrack(id) {
        if (id === currentTrack) {
            return false;
        }
        
        _unBoldTrack(currentTrack);
        _boldTrack(id);
        currentTrack = id;
        return true;
    }
    
    function _setTrackProgress(progress) {
        if (currentTrack == null) { 
            return;
        }
        if (document.getElementById(currentTrack)) {
            var t = document.getElementById(currentTrack).innerHTML;
            
            if (t.lastIndexOf("/") !== -1 && t.lastIndexOf("/") > t.lastIndexOf("(")) {
                t = t.substr(0, t.lastIndexOf("(") + 1) + progress + t.substr(t.lastIndexOf("/"));
            } else {
                t = t.substr(0, t.lastIndexOf("(") + 1) + progress + "/" + t.substr(t.lastIndexOf("(") + 1);
            }
            
            document.getElementById(currentTrack).innerHTML = t;
        }
    }
    
    function _isDisplayingTrack(id) {
        return document.getElementById(id) !== null;
    }

    function _backgroundFade() {
        backgroundOpacity -= 0.04;
        for (const track of document.querySelectorAll(DOMElements.trackClass)) {
            track.style.backgroundColor = "rgba(179, 230, 230, " + backgroundOpacity + ")";
        }

        if (backgroundOpacity >= 0) {
            setTimeout(_backgroundFade, 10);
        }
    }
    
    return {
        
        inputField() {
            return {
                length: (parseFloat(document.querySelector(DOMElements.lengthH).value) || 0) * 3600000 + (parseFloat(document.querySelector(DOMElements.lengthM).value) || 0) * 60000 + (parseFloat(document.querySelector(DOMElements.lengthS).value) || 0) * 1000,
                lengthRange: document.querySelector(DOMElements.lengthRange).value ? parseFloat(document.querySelector(DOMElements.lengthRange).value) * 1000 : -1,
                minSongLength: (parseFloat(document.querySelector(DOMElements.minSongLengthM).value) || 0) * 60000 + (parseFloat(document.querySelector(DOMElements.minSongLengthS).value) || 0) * 1000,
                maxSongLength: (parseFloat(document.querySelector(DOMElements.maxSongLengthM).value) || 0) * 60000 + (parseFloat(document.querySelector(DOMElements.maxSongLengthS).value) || 0) * 1000,
                minTracks: (parseInt(document.querySelector(DOMElements.minTracks).value) || 0),
                maxTracks: (parseInt(document.querySelector(DOMElements.maxTracks).value) || 0),
                selectSourceType: document.querySelector(DOMElements.selectSourceType),
                selectSourceItem: document.querySelector(DOMElements.selectSourceItem),
                itemInputPrompt: document.querySelector(DOMElements.itemInputPrompt),
                rangeInputPrompt: document.querySelector(DOMElements.rangeInputPrompt),
                info: document.querySelector(DOMElements.info),
                featureMin: document.querySelector(DOMElements.featureMin),
                featureMax: document.querySelector(DOMElements.featureMax),
                play: document.querySelector(DOMElements.buttonPlay),
                save: document.querySelector(DOMElements.buttonSave),
                regenerate: document.querySelector(DOMElements.buttonRegenerate),
                shuffle: document.querySelector(DOMElements.buttonShuffle),
                login: document.querySelector(DOMElements.buttonLogin),
                tracks: document.querySelector(DOMElements.divSongList),
                hfToken: document.querySelector(DOMElements.hfToken)
            }
        },
        
        addSourceItem(text, value) {
            const html = '<option value="' + value + '">' + text + '</option>';
            document.querySelector(DOMElements.selectSourceItem).insertAdjacentHTML('beforeend', html);
        },
        createTrack(id, index, name, artist, length) {
            const html = '<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="' + id + '">' + name + ' by ' + artist + ' (' + length.toHHMMSS() + ')' + '</a>';
            document.querySelector(DOMElements.divSongList).insertAdjacentHTML('beforeend', html);
        },
        startPlaylistAnimation() {
            backgroundOpacity = 1.0;
            _backgroundFade();
        },
        setCurrentTrack(id) {
            return _setCurrentTrack(id);
        },
        setTrackProgress(progress) {
            _setTrackProgress(progress);
        },
        isDisplayingTrack(id) {
            return _isDisplayingTrack(id);
        },
        resetTracks() {
            this.inputField().tracks.innerHTML = '';
        },
        resetSourceItems() {
            this.inputField().selectSourceItem.innerHTML = '';
            this.resetTracks();
        },
        resetRangeInputs() {
            this.inputField().featureMin.value = '';
            this.inputField().featureMin.value = '';
        },
        setItemInputPrompt(value) {
            this.inputField().itemInputPrompt.innerHTML = value;
        },
        setRangeInputPrompt(value) {
            this.inputField().rangeInputPrompt.innerHTML = value;
        },
        setInfoText(value) {
            this.inputField().info.innerHTML = value;
        }, 
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },
        getStoredToken() {
            return document.querySelector(DOMElements.hfToken).value;
        },
        getFeatureMin() {
            return parseFloat(this.inputField().featureMin.value);
        },
        getFeatureMax() {
            return parseFloat(this.inputField().featureMax.value);
        },
        hasFeatureMin() {
            return this.inputField().featureMin.value !== "";
        },
        hasFeatureMax() {
            return this.inputField().featureMax.value !== "";
        }
    }
    
})();

const PlaylistGenerator = (function() {
    
    var tracklist = [];
    var generatedPlaylist = [];
    
    function getPermutations(array, size) {
        function p(t, i) {
            if (t.length === size) {
                result.push(t);
                return;
            }
            if (i + 1 > array.length) {
                return;
            }
            p(t.concat(array[i]), i + 1);
            p(t, i + 1);
        }

        var result = [];
        p([], 0);
        return result;
    }
    
    /**
     * Given a shuffled list, counts how many items, from left to right,
     * are needed to reach a specified minimum duration.
     */
    function itemsNeeded(tracks, minLength) {
        if (minLength <= 0) {
            return {
                items: 0,
                duration: 0
            }
        }
            
        var duration = 0;
        var trackDuration;
        for (var i = 0; i < tracks.length; i++) {
            trackDuration = tracks[i].duration_ms;
            if (trackDuration === NaN) break;
            duration += trackDuration;
            if (duration >= minLength) {
                return {
                    items: i + 1,
                    duration: duration
                }
            }
        }
        console.log("error: itemsNeeded was given " + tracks.length + " tracks and minLength " + minLength + ", duration is currently at " + duration);
    }
    
    function shuffledCopy(array) {
        return shuffle(array.slice());
    }
    
    function shuffle(array) {
        var currentIndex = array.length;
        var temporaryValue, randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }
    
    function _setTracklist(tracks) {
        tracklist = tracks;
    }
    
    function _sumOfFirst(list, amount, ignore) {
        var index = 0;
        var sum = 0;
        for (var i = 0; i < amount; i++) {
            if (index === ignore) { index++; }
            sum += list[index].duration_ms;
            index++;
        }
        return sum;
    }
    
    function _trackIndex(list, track) {
        for (var i = 0; i < list.length; i++) {
            if(list[i].id === track.id) {
                return i;
            }
        }
        return -1;
    }
    
    function _filterTracks(tracks, min, max, minTracks = 0, maxTracks = -1) {
        var sortedTracks, reverseSortedTracks;
        
        if (minTracks === 0 && maxTracks === -1) { // No specific min or max number of tracks
            return tracks.filter((track) => track.duration_ms <= max);
        } else if (minTracks === 1 && maxTracks === 1) {
            return tracks.filter((track) => (min <= track.duration_ms && track.duration_ms <= max));
        } else if (minTracks === 2 && maxTracks === 2) {
            sortedTracks = tracks.slice();
            sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms) ? 1 : -1);
            reverseSortedTracks = sortedTracks.slice();
            reverseSortedTracks.reverse();

            var addsToOther, sortedIndex, shortestOtherTrack, longestOtherTrack, notTooLong, notTooShort;
            return tracks.filter((track, trackIndex) => {
                addsToOther = tracks.some((track2) => {
                    var length = track.duration_ms + track2.duration_ms;
                    return track !== track2 && min <= length && length <= max;
                });

                /* sortedIndex = _trackIndex(sortedTracks, track);
                shortestOtherTrack = sortedTracks[sortedIndex === 0 ? 1 : 0].duration_ms;
                longestOtherTrack = reverseSortedTracks[sortedIndex === sortedTracks.length - 1 ? 1 : 0].duration_ms;

                notTooLong = track.duration_ms + shortestOtherTrack <= max;
                notTooShort = track.duration_ms + longestOtherTrack >= min; */
                return /* notTooLong && notTooShort && */ addsToOther;
            });
        } else {
            sortedTracks = tracks.slice();
            sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms) ? 1 : -1);
            reverseSortedTracks = sortedTracks.slice();
            reverseSortedTracks.reverse();

            var sortedIndex, shortestOtherTracks, longestOtherTracks, notTooLong, notTooShort;
            return tracks.filter((track, trackIndex) => {
                var sortedIndex = _trackIndex(sortedTracks, track);
                var shortestOtherTracks = _sumOfFirst(sortedTracks, minTracks - 1, sortedIndex);
                var notTooLong = track.duration_ms + shortestOtherTracks <= max;
                
                var notTooShort;
                if (maxTracks !== -1) {
                    var longestOtherTracks = _sumOfFirst(reverseSortedTracks, maxTracks - 1, tracks.length - 1 - sortedIndex);
                    notTooShort = track.duration_ms + longestOtherTracks >= min;
                } else {
                    notTooShort = true;
                }
                
                return notTooLong && notTooShort;
            });
        }
    }
    
    function getSwaps(tracks, items, swapL, swapR, goalMin, goalMax) {
        if (swapL === 1 && swapR === 1) {
            for (var i = 0; i < items; i++) {
                for (var j = items; j < tracks.length; j++) {
                    dif = tracks[j].duration_ms - tracks[i].duration_ms;
                    if (goalMin <= dif && dif <= goalMax) {
                        return [i, j];
                    }
                }
            }
        }
        return null;
    }
    
    function _generate(min, max, minSongLength, maxSongLength, minTracks, maxTracks, inverted = false, specifiedTracks = []) {
        generatedPlaylist = [];
        
        console.log("generating between " + min + " and " + max + " length, between " + minTracks + " and " + maxTracks + " tracks");
        
        var timer = Date.now();
                
        if (tracklist.length === 0) { // No tracklist has been set
            window.alert("The chosen source is empty!");
            return [];
        }
        
        if (maxSongLength < minSongLength) {
            window.alert("The minimum song length (" + minSongLength.toHHMMSS() + ") is larger than the maximum song length (" + maxSongLength.toHHMMSS() + "\)!");
            return [];
        }
        
        if (maxTracks !== -1 && minTracks > maxTracks) {
            window.alert("Make sure the minimum number of tracks is not bigger than the maximum number of tracks!");
            return [];
        }
        
        // filter to songs between min and max song length
        var shuffledTracks = (inverted ? specifiedTracks : tracklist).filter((track) => (minSongLength <= track.duration_ms && track.duration_ms <= maxSongLength)); 
        var shuffledTracks = shuffle(shuffledTracks);
        
        var totalLength = shuffledTracks.reduce(function(prev, cur) {
            return prev + cur.duration_ms;
        }, 0);
        
        if ((min + max) / 2 == 0 && !inverted) {
            return shuffledTracks;
        }
        
        if (totalLength < min) {
            window.alert("The chosen source (" + totalLength.toHHMMSS() + ") is too short for the time you requested (" + ((min + max) / 2).toHHMMSS() + "\)!");
            return [];
        }
        
        var sortedTracks = shuffledTracks.slice();
        sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms) ? 1 : -1);
        var reverseSortedTracks = sortedTracks.slice();
        reverseSortedTracks.reverse();
        
        if (maxTracks !== -1 && min > _sumOfFirst(reverseSortedTracks, maxTracks)) {
            window.alert("Unable to create a playlist of length " + ((min + max) / 2).toHHMMSS() + " with only " + maxTracks + " track" + (maxTracks === 1 ? "." : "s."));
            return [];
        }
        
        if (max < _sumOfFirst(sortedTracks, minTracks)) {
            window.alert("Unable to create a playlist of length " + ((min + max) / 2).toHHMMSS() + " with at least " + minTracks + " track" + (minTracks === 1 ? "." : "s."));
            return [];
        }
        
        // We can raise the actual minimum number of tracks to help with the filtering
        minTracks = Math.max(minTracks, itemsNeeded(reverseSortedTracks, min).items);
        // In the same way, we can lower max tracks
        if (maxTracks !== -1) {
            maxTracks = Math.min(maxTracks, itemsNeeded(sortedTracks, min).items);
        }
        
        if (maxTracks !== -1 && minTracks > maxTracks) {
            window.alert("Unable to find a combination of songs with that length.");
            return [];
        }
        
        shuffledTracks = _filterTracks(shuffledTracks, min, max, minTracks, maxTracks); // Find tracks fit in the specified duration
    
        // Make sorted lists again since some songs were removed
        sortedTracks = shuffledTracks.slice();
        sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms) ? 1 : -1);
        reverseSortedTracks = sortedTracks.slice();
        reverseSortedTracks.reverse();
        
        totalLength = shuffledTracks.reduce(function(prev, cur) {
            return prev + cur.duration_ms;
        }, 0);
        
        console.log("filter phase: " + (Date.now() - timer));
        timer = Date.now();
        console.log("After filtering we have a list of " + shuffledTracks.length + " tracks, with length " + totalLength);
        console.log(shuffledTracks);
        
        if (totalLength < min) {
            window.alert("Unable to find a combination of songs with that length.");
            return [];
        } else if (shuffledTracks.length === 0 && min <= 0 && 0 <= max) { // No possible songs, but a playlist of length 0 is allowed
            return [];
        } else if (min + max > totalLength) { // Average of min and max is greater than half the total length
            var newMinTracks = (maxTracks === -1) ? 0 : shuffledTracks.length - maxTracks;
            var newMaxTracks = (minTracks === 0) ? -1 : shuffledTracks.length - minTracks;
            generatedPlaylist = _generate(totalLength - max, totalLength - min, minSongLength, maxSongLength, newMinTracks, newMaxTracks, true, shuffledTracks); // generate an "inverted" playlist of songs to exclude, resulting in a playlist of the desired length
            if (generatedPlaylist == null) { // Inverted playlist failed
                window.alert("Unable to find a combination of songs with that length.");
                return [];
            }
            return shuffledTracks.filter((track) => !generatedPlaylist.includes(track));
        }
        
        if (shuffledTracks.length == 0) {
            if (inverted) return null; // return null to avoid confusion with the empty playlist []
            
            sortedTracks = filteredList.slice();
            sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms) ? 1 : -1);
            
            if (minTracks === 0 && maxTracks === -1) {
                window.alert("The time you requested (" + ((min + max) / 2).toHHMMSS() + "\) is shorter than the shortest song available (" + sortedTracks[0].duration_ms.toHHMMSS() + ")!");
            } else {
                window.alert("Unable to find a combination of songs with that length.");
            }
            return [];
        }
        
        // Must return a playlist of length 0 in order to meet the criteria:
        if (sortedTracks[0].duration_ms > max && min <= 0 && 0 <= max) {
            return [];
        }

        // Start from the beginning of shuffledTracks, and going from left to right find
        // how many tracks are needed to reach the minimum length
        var itemsAndDuration = itemsNeeded(shuffledTracks, min);  
        var items = itemsAndDuration.items; // number of tracks
        var duration = itemsAndDuration.duration; // total duration of these tracks
        
        if (items < minTracks) {            
            // Create a list of indexes outside of the current playlist we can swap with
            var availableIndexes = [];

            for (var i = items; i < shuffledTracks.length; i++) {
               availableIndexes.push(i);
            }
            
            var canSwap = []; // An array of indexes that can be swapped (i.e. there is a smaller song outside of the current playlist)
            
            for (var i = 0; i < items; i++) {
               canSwap.push(i);
            }
            
            while (items < minTracks) {
                availableIndexes = shuffle(availableIndexes);

                // Randomly switch a song with a shorter one
                var selectedIndex = canSwap[Math.floor(Math.random() * canSwap.length)];
                var selectedDuration = shuffledTracks[selectedIndex].duration_ms;

                var completedSwap = false;

                for (const otherIndex of availableIndexes) {        
                    if (shuffledTracks[otherIndex].duration_ms < selectedDuration) {
                        duration -= selectedDuration;
                        duration += shuffledTracks[otherIndex].duration_ms;
                        var temp = shuffledTracks[selectedIndex];
                        shuffledTracks[selectedIndex] = shuffledTracks[otherIndex];
                        shuffledTracks[otherIndex] = temp;

                        while (duration < min) { // We can now fit in a new song, adjust items and duration
                            duration += shuffledTracks[items].duration_ms;
                            availableIndexes.splice(availableIndexes.indexOf(items), 1); // can no longer swap with this item
                            canSwap.push(items); // add this index to the list of indexes that can be swapped
                            items++;
                        }
                        
                        completedSwap = true;
                        break;
                    }
                }

                if (!completedSwap) {
                    canSwap.splice(canSwap.indexOf(selectedIndex), 1); // this index cannot be swapped, so remove it
                }
            }
        }
        
        if (maxTracks !== -1 && items > maxTracks) {            
            // Create a list of indexes outside of the current playlist we can swap with
            availableIndexes = [];
            
            // The strategy for maximum is to decrease items,
            // and swap songs out for larger ones until this list is bigger then min.
            // Then, repeat until items = maxTracks
            
            items--;
            duration -= shuffledTracks[items].duration_ms;

            for (var i = items; i < shuffledTracks.length; i++) {
               availableIndexes.push(i);
            }
            
            canSwap = []; // An array of indexes that can be swapped (i.e. there is a smaller song outside of the current playlist)
            
            for (var i = 0; i < items; i++) {
               canSwap.push(i);
            }
            
            while (items >= maxTracks) {
                availableIndexes = shuffle(availableIndexes);

                // Randomly switch a song with a shorter one
                var selectedIndex = canSwap[Math.floor(Math.random() * canSwap.length)];
                var selectedDuration = shuffledTracks[selectedIndex].duration_ms;

                var completedSwap = false;

                for (const otherIndex of availableIndexes) {        
                    if (shuffledTracks[otherIndex].duration_ms > selectedDuration) {
                        duration -= selectedDuration;
                        duration += shuffledTracks[otherIndex].duration_ms;
                        var temp = shuffledTracks[selectedIndex];
                        shuffledTracks[selectedIndex] = shuffledTracks[otherIndex];
                        shuffledTracks[otherIndex] = temp;

                        while (duration > min) { // We can now remove a new song, adjust items and duration
                            items--;
                            duration -= shuffledTracks[items].duration_ms;
                            canSwap.splice(canSwap.indexOf(items), 1);  // can no longer swap with this item 
                            availableIndexes.push(items); // add this index to the list of indexes that can be swapped 
                            
                        }
                        
                        completedSwap = true;
                        break;
                    }
                }

                if (!completedSwap) {
                    canSwap.splice(canSwap.indexOf(selectedIndex), 1); // this index cannot be swapped, so remove it
                }
            }
            
            // At the end, items gets decremented one more time from maxTracks, so adjust it back
            duration += shuffledTracks[items].duration_ms;
            items++;
        }
        
        console.log("build and swap phase: " + (Date.now() - timer));
        console.log("ready for adjustments, we have a playlist with " + items + " tracks and length " + duration);

        if (duration <= max && minTracks <= items && items <= maxTracks) { // min <= duration <= max, so we can return the playlist as is
            return shuffledTracks.slice(0, items);
        }

        var remainingMin, remainingMax;
        var minNeededSongs, maxNeededSongs;
        var tracksToAddDuration;
        var filteredTracks;
        var succeeded = false;
        
        timer = Date.now();
        console.log("attempting swap to get " + (min - duration) + " to " + (max - duration));
        if (getSwaps(shuffledTracks, items, 1, 1, min - duration, max - duration)) {
            console.log("swap found in " + (Date.now() - timer));
        }
        
        timer = Date.now();

        // Now, sequentially remove songs from the current playlist one at a time and attempt to reach the desired range
        // by considering all possible permutations
        while (items > 0) {
            // remove one song at a time from the playlist by decrementing "items"
            // and adjusting duration accordingly
            items--;
            duration -= shuffledTracks[items].duration_ms;
            
            console.log("attempting with " + items + " items");
            
            remainingMin = min - duration;
            remainingMax = max - duration;
                                    
            minNeededSongs = itemsNeeded(reverseSortedTracks, remainingMin).items; // lowest possible number of songs to add
            maxNeededSongs = itemsNeeded(sortedTracks, remainingMax).items; // highest possible number of songs to add
            
            minNeededSongs = Math.max(minTracks - items, minNeededSongs); // We need to reach the minimum amount of tracks
            if (maxTracks !== -1) {
                maxNeededSongs = Math.min(maxTracks - items, maxNeededSongs); // Ensure we are under maximum amount of tracks
            }
            
            for (var songsToAdd = minNeededSongs; songsToAdd <= maxNeededSongs; songsToAdd++) {
                // Assuming we are adding songsToAdd more songs, which tracks could work to reach this length
                filteredTracks = _filterTracks(shuffledTracks.slice(items), remainingMin, remainingMax, songsToAdd, songsToAdd);
                
                // Go through all permutations and call the following function on each
                succeeded = getPermutations(filteredTracks, songsToAdd).some(function(tracksToAdd) {
                    tracksToAddDuration = tracksToAdd.reduce(function(prev, cur) {
                        return prev + cur.duration_ms;
                    }, 0);
                    
                    if (remainingMin <= tracksToAddDuration && tracksToAddDuration <= remainingMax) {
                        generatedPlaylist = shuffledTracks.slice(0, items).concat(tracksToAdd);
                        return true;
                    }
                });

                if (succeeded) {
                    duration += tracksToAddDuration;
                    console.log("Finalize phase: " + (Date.now() - timer));
                    return generatedPlaylist;
                }
            }
        }
        
        if (inverted) return null;
        
        window.alert("Unable to find a combination of songs with that length.");
        return [];
    }

    return {
        setTracklist(tracks) {
            _setTracklist(tracks);
        },
        
        generate(min, max, minSongLength, maxSongLength, minTracks, maxTracks) {
            generatedPlaylist = _generate(min, max, minSongLength, maxSongLength, minTracks, maxTracks);
            generatedPlaylist = shuffle(generatedPlaylist);
            return generatedPlaylist;
        },
        
        shufflePlaylist() {
            generatedPlaylist = shuffle(generatedPlaylist);
        },
        
        getNumTracks() {
            return generatedPlaylist == null ? 0 : generatedPlaylist.length;
        },
        
        getDuration() {
            return generatedPlaylist == null ? 0 : generatedPlaylist.reduce(function(prev, cur) {
                return prev + cur.duration_ms;
            }, 0);
        },
        
        isFirstTrack(id) {
            return id === generatedPlaylist[0].id;
        },
        
        getTimeRemaining(id, progress) {
            var trackIndex = generatedPlaylist.findIndex((track) => track.id === id);
            return generatedPlaylist == null ? 0 : generatedPlaylist.slice(trackIndex).reduce(function(prev, cur) {
                return prev + cur.duration_ms;
            }, 0) - progress;
        }
    }
    
})();

const AppController = (function(UICtrl, APICtrl, PlaylistGenerator) {
    const originalTitle = document.title;
    
    const DOMInputs = UICtrl.inputField();
    
    var sources = null;
    var userPlaylists = null;
    var sourceType = null;
    var sourceItem = null;
    var generatedPlaylist = [];
    var userID = null;
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
    
    
    function setOnLoad(_needsFeatures, _needsGenres, _onLoad) {
        onLoad = _onLoad;
        needsFeatures = _needsFeatures;
        needsGenres = _needsGenres;
        
        onLoad = () => {
            if (needsFeatures && !APICtrl.hasLikedSongFeatures()) {
                APICtrl.getLikedSongFeatures(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t)).then(onLoad);
            } else if (needsGenres && !APICtrl.hasLikedSongGenres()) {
                APICtrl.getUserGenres(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t)).then(onLoad);    
            } else {
                _onLoad();
                loading = false;
            }
        }
        
        if (!loading) {
            APICtrl.getLikedSongs(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t)).then(() => {
                onLoad();
            });
        }
        
        loading = true;
    }
    
    const start = async () => {
        const tokenAndUserID = await APICtrl.getTokenAndUserID();
        var token = tokenAndUserID.token;
        userID = tokenAndUserID.userID;
        if (token !== null) {
            UICtrl.storeToken(token);
            updateSourceType();
            stateTimer = setInterval(updateState, updateStateInterval);
        }
    }
    
    const loadPlaylists = async () => {
        onLoad = () => null;
        UICtrl.setItemInputPrompt("Playlist: ");
        sources = await APICtrl.getUserPlaylists(UICtrl.getStoredToken(), userID);
        userPlaylists = sources.slice();
        UICtrl.addSourceItem("Liked Songs", "liked songs");
        sources.forEach(element => UICtrl.addSourceItem(element.name, element.id));
        UICtrl.setInfoText("Choose a length and playlist to start!");
    }
    
    const loadArtists = async () => {
        onLoad = () => null;
        UICtrl.setItemInputPrompt("Artist: ");
        sources = await APICtrl.getUserArtists(UICtrl.getStoredToken());
        sources.sort((a, b) => (a.name > b.name) ? 1 : -1);
        sources.forEach(element => UICtrl.addSourceItem(element.name, element.name));
        UICtrl.setInfoText("Choose a length and artist to start!");
    }
    
    const loadArtistsLikedSongs = async () => {
        UICtrl.setItemInputPrompt("Artist: ");
        sources = await APICtrl.getUserArtists(UICtrl.getStoredToken());
        sources.sort((a, b) => (a.name > b.name) ? 1 : -1);
        sources.forEach(element => UICtrl.addSourceItem(element.name, element.id));
        sourceItem = "";
        
        setOnLoad(false, false, async () => {
            if (sourceItem !== "") {
                updateTracklist();
            } else {
                UICtrl.setInfoText("Choose a length and artist to start!");
            }
        });
        UICtrl.setInfoText("Choose a length and artist to start!");
    }
    
    const loadGenres = async () => {
        UICtrl.setItemInputPrompt("Genre: ");
        setOnLoad(false, true, async () => {
            sources = await APICtrl.getUserGenres(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t));
            sources.sort();
            sources.forEach(element => UICtrl.addSourceItem(element, element));
            UICtrl.setInfoText("Choose a length and genre to start!");
        });
    }
    
    const loadDecades = async () => {
        UICtrl.setItemInputPrompt("Decade: ");
        setOnLoad(true, false, async () => {
            sources = await APICtrl.getUserDecades(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t));
            sources.sort();
            sources.forEach(element => UICtrl.addSourceItem(element, element));
            UICtrl.setInfoText("Choose a length and decade to start!");
        });
    }
    
    const loadFeature = async (featureName) => {
        UICtrl.setRangeInputPrompt(featureName.replace("_", " ").titleCase() + (featureName !== "tempo" ? " (%):" : ""));
        setOnLoad(true, false, async () => {
            UICtrl.setInfoText("Choose a length and set " + featureName + " values to start!");
            if (UICtrl.hasFeatureMax() || UICtrl.hasFeatureMin()) {
                updateTracklist();
            }
        });
        sourceItem = "";
    }
    
    const loadKeys = async (featureName) => {
        UICtrl.setItemInputPrompt("Key: ");
        setOnLoad(true, false, async () => {
            sources = await APICtrl.getUserKeys(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t));
            sources.sort();
            sources.forEach(element => UICtrl.addSourceItem(element, element));
            UICtrl.setInfoText("Choose a length and key to start!");
        });
    }
    
    const loadTimeSignatures = async (featureName) => {
        UICtrl.setItemInputPrompt("Time Signature: ");
        setOnLoad(true, false, async () => {
            sources = await APICtrl.getUserTimeSignatures(UICtrl.getStoredToken(), (t) => UICtrl.setInfoText(t));
            sources.sort();
            sources.forEach(element => UICtrl.addSourceItem(element, element));
            UICtrl.setInfoText("Choose a length and time signature to start!");
        });
    }
    
    
    const updateTracklist = async () => {
        UICtrl.resetTracks();
        var tracks;
        
        if (sourceTypeUsesItem) {
            if (sourceItem === "") return;
        } else {
            if (!UICtrl.hasFeatureMax() && !UICtrl.hasFeatureMin()) {
                return;
            }
            if (UICtrl.hasFeatureMax() && UICtrl.hasFeatureMin() && UICtrl.getFeatureMax() < UICtrl.getFeatureMin()) {
                console.log("invalid range");
                return;
            }
        }
                        
        UICtrl.setInfoText("Loading tracks...");
        
        switch (sourceType) {
            case "Playlist":
                tracks = await APICtrl.getTracksFromPlaylist(UICtrl.getStoredToken(), sourceItem, (t) => UICtrl.setInfoText(t));
                break;
            case "Artist":
                tracks = await APICtrl.getTracksFromArtist(UICtrl.getStoredToken(), sourceItem, (t) => UICtrl.setInfoText(t));
                break;
            case "Artist (liked songs only)":
                tracks = await APICtrl.getLikedTracksFromArtist(UICtrl.getStoredToken(), sourceItem, (t) => UICtrl.setInfoText(t));
                break;
            case "Genre (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithGenre(UICtrl.getStoredToken(), sourceItem, (t) => UICtrl.setInfoText(t));
                break;
            case "Decade (liked songs only)":
                tracks = await APICtrl.getLikedSongsFromDecade(UICtrl.getStoredToken(), sourceItem, (t) => UICtrl.setInfoText(t));
                break;
            case "Acousticness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "acousticness", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Danceability (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "danceability", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Energy (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "energy", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Instrumentalness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "instrumentalness", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Liveness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "liveness", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Speechiness (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "speechiness", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Tempo (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "tempo", UICtrl.getFeatureMin(), UICtrl.getFeatureMax(), (t) => UICtrl.setInfoText(t));
                break;
            case "Valence (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "valence", UICtrl.getFeatureMin() * 0.01, UICtrl.getFeatureMax() * 0.01, (t) => UICtrl.setInfoText(t));
                break;
            case "Time signature (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithFeature(UICtrl.getStoredToken(), "time_signature", sourceItem, sourceItem, (t) => UICtrl.setInfoText(t));
                break;
            case "Key (liked songs only)":
                tracks = await APICtrl.getLikedSongsWithKey(UICtrl.getStoredToken(), sourceItem, (t) => UICtrl.setInfoText(t));
                break;
        }
        PlaylistGenerator.setTracklist(tracks);
        
        generatePlaylist();
    }
    
    const generatePlaylist = async () => {
        var maxLength = UICtrl.inputField().maxSongLength;
        if (maxLength <= 0) maxLength = Infinity;
        
        var range = UICtrl.inputField().lengthRange;
        if (range < 0) range = 499; // default to within one second
        
        var maxTracks = UICtrl.inputField().maxTracks;
        if (maxTracks <= 0) maxTracks = -1;
        
        await UICtrl.setInfoText("Generating playlist...");
        
        // Allows the info text to be updated
        setTimeout(function() {
            generatedPlaylist = PlaylistGenerator.generate(UICtrl.inputField().length - range, UICtrl.inputField().length + range, UICtrl.inputField().minSongLength, maxLength, UICtrl.inputField().minTracks, maxTracks);
            
            UICtrl.resetTracks();

            generatedPlaylist.forEach((el, num) => UICtrl.createTrack(el.id, num, el.name, el.artists.map(a => a.name).join(', '), el.duration_ms));
            UICtrl.startPlaylistAnimation();

            UICtrl.setInfoText(PlaylistGenerator.getNumTracks() + " songs, " + PlaylistGenerator.getDuration().toHHMMSS());
        }, 1);
    }
    
    const savePlaylist = async () => {
        if (generatedPlaylist.length > 0) {
            const defaultName = "Spotify Music Timer";
            var name = await window.prompt("Enter a name for the playlist: ", defaultName);
            if (name === "") return;
            const playlistURIs = generatedPlaylist.map(a => a.uri);
            
            var id = null;
            if (name === defaultName) {
                if (userPlaylists === null) {
                    userPlaylists = await APICtrl.getUserPlaylists(token, userID);
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
                var id = await APICtrl.createPlaylist(UICtrl.getStoredToken(), userID, name);
            }
            
            APICtrl.addTracksToPlaylist(UICtrl.getStoredToken(), id, playlistURIs);
            
        } else {
            window.alert("Generate a playlist first!");
            // TODO: disable button
        }
    }
    
    const updateSourceType = async () => {
        sourceType = DOMInputs.selectSourceType.value;
        UICtrl.resetSourceItems();
        UICtrl.addSourceItem("Select...", "");
        
        const usesItem = ["Playlist", "Artist", "Artist (liked songs only)", "Genre (liked songs only)", "Decade (liked songs only)", "Key (liked songs only)", "Time signature (liked songs only)"]
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
    }
    
    const playGeneratedPlaylist = async () => {
        const playlistURIs = generatedPlaylist.map(a => a.uri);
        var beepURI = "spotify:track:71a1rPBpAM5w8okBdlbbwU";
        await APICtrl.playURIS(UICtrl.getStoredToken(), [...playlistURIs, beepURI]);
        clock = null;
        setTimeout(() => updateState(false), 500);
    }
    
    const updateState = async(runAgain = true) => {
        state = await APICtrl.getPlaybackState(UICtrl.getStoredToken());

        if (state !== null && state.item != null && UICtrl.isDisplayingTrack(state.item.id)) {
            var currentProgress = Date.now() - state.timestamp;
            var reportedProgress = state.progress_ms;
            if (Math.abs(currentProgress - reportedProgress) > 1000) {
                state.timestamp = Date.now() - state.progress_ms; // update timestamp to approximately when the song started playing
            }
            
            var trackTimeRemaining = state.item.duration_ms - currentProgress;

            var isNewTrack = UICtrl.setCurrentTrack(state.item.id);
            if (isNewTrack) {
                UICtrl.setTrackProgress(Math.min(currentProgress, state.item.duration_ms).toHHMMSS());
                // var beepURI = "spotify:track:71a1rPBpAM5w8okBdlbbwU";
                if (PlaylistGenerator.isFirstTrack(state.item.id) && clock !== null && !state.isPlaying && state.progress_ms === 0) {
                    // await APICtrl.playURIS(UICtrl.getStoredToken(), [beepURI]);
                    // playlist finished
                }
            }
            
            if (!clockTimer) {
                clockTimer = setInterval(updateClock, updateClockInterval);
            }
            
            if (runAgain) {
                if (trackTimeRemaining < updateStateInterval) {
                    clearInterval(stateTimer);
                    setTimeout(() => {
                        updateState();
                        stateTimer = setInterval(updateState, updateStateInterval);
                    }, trackTimeRemaining);
                }
            }
        } else {
            if (state === null || state.item === null) {
                UICtrl.setCurrentTrack(null);
            }
        }
    }
    
    const updateClock = async() => {
        var infoText = PlaylistGenerator.getNumTracks() + " songs, " + PlaylistGenerator.getDuration().toHHMMSS();
        
        if (state !== null && UICtrl.isDisplayingTrack(state.item.id)) {
            var currentProgress = state.is_playing ? (Date.now() - state.timestamp) : state.progress_ms;
            var timeRemaining = PlaylistGenerator.getTimeRemaining(state.item.id, currentProgress);
            var trackTimeRemaining = state.item.duration_ms - currentProgress;
            
            // console.log("Last clock: " + clock + ", remaining time: " + timeRemaining);
            if (timeRemaining >= 0 && (clock === null || (Math.floor(timeRemaining / 1000) < Math.floor(clock / 1000)) || timeRemaining - clock > 2000)) {
                // Clock should be updated!
                infoText += " (" + timeRemaining.toHHMMSS(false) + " remaining)";
                document.title = "(" + timeRemaining.toHHMMSS(false) + ") " + originalTitle;
                clock = timeRemaining;
                UICtrl.setInfoText(infoText);
                UICtrl.setTrackProgress(Math.min(currentProgress, state.item.duration_ms).toHHMMSS(false));
            } else if (timeRemaining < 0) {
                UICtrl.setInfoText(infoText);
            }
        } else if (PlaylistGenerator.getNumTracks() > 0) {
            console.log("clocked stopped, not playing");
            UICtrl.setInfoText(infoText);
            document.title = originalTitle;
            clock = null;
            clearInterval(clockTimer);
            clockTimer = null;
        } else {
            console.log("clocked stopped, playlist empty");
            clock = null;
            clearInterval(clockTimer);
            clockTimer = null;
        }
    }
    
    DOMInputs.selectSourceType.addEventListener('change', async () => {
        await updateSourceType();
    })
    
    DOMInputs.selectSourceItem.addEventListener('change', async () => {
        sourceItem = DOMInputs.selectSourceItem.value;
        if (!loading) {
            updateTracklist();
        }
    });
    
    DOMInputs.featureMin.addEventListener('change', async () => {
        if (!loading) {
            updateTracklist();
        }
    })
    
    DOMInputs.featureMax.addEventListener('change', async () => {
        if (!loading) {
            updateTracklist();
        }
    })
    
    DOMInputs.save.addEventListener('click', async (e) => {
        await savePlaylist();
    });
    
    DOMInputs.regenerate.addEventListener('click', async (e) => {
        await generatePlaylist();
    });
    
    DOMInputs.shuffle.addEventListener('click', async (e) => {
        PlaylistGenerator.shufflePlaylist();
        UICtrl.resetTracks();
        generatedPlaylist.forEach((el, num) => UICtrl.createTrack(el.id, num, el.name, el.artists.map(a => a.name).join(', '), el.duration_ms));
    });
    
    DOMInputs.play.addEventListener('click', async (e) => {
        e.preventDefault();
        playGeneratedPlaylist();
    });
    
    DOMInputs.login.addEventListener('click', function() {
        APICtrl.loginToSpotify();
    }, false);
    
    return {
        init() {
            start();
        }
    }
    
})(UIController, APIController, PlaylistGenerator);

AppController.init();

