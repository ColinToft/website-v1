const PlaylistGenerator = (function () {
    var tracklist = [];
    var generatedPlaylist = [];

    var songSpacing = 0;

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
                duration: 0,
            };
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
                    duration: duration,
                };
            }
        }
        console.log(
            "error: itemsNeeded was given " +
                tracks.length +
                " tracks and minLength " +
                minLength +
                ", duration is currently at " +
                duration
        );
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

    function _setTracklist(tracks, newSongSpacing) {
        // Set tracklist to be equal to tracks, while dealing with song spacing (time between songs)
        // We handle this by adding the duration of the song spacing to the duration of each song
        tracklist = tracks.map((track) => {
            return {
                ...track,
                duration_ms: track.duration_ms + newSongSpacing,
            };
        });

        songSpacing = newSongSpacing;
    }

    function _sumOfFirst(list, amount, ignore) {
        var index = 0;
        var sum = 0;
        for (var i = 0; i < amount; i++) {
            if (index === ignore) {
                index++;
            }
            sum += list[index].duration_ms;
            index++;
        }
        return sum;
    }

    function _trackIndex(list, track) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === track.id) {
                return i;
            }
        }
        return -1;
    }

    function _filterTracks(tracks, min, max, minTracks = 0, maxTracks = -1) {
        var sortedTracks, reverseSortedTracks;

        if (minTracks === 0 && maxTracks === -1) {
            // No specific min or max number of tracks
            return tracks.filter((track) => track.duration_ms <= max);
        } else if (minTracks === 1 && maxTracks === 1) {
            return tracks.filter(
                (track) => min <= track.duration_ms && track.duration_ms <= max
            );
        } else if (minTracks === 2 && maxTracks === 2) {
            sortedTracks = tracks.slice();
            sortedTracks.sort((a, b) =>
                a.duration_ms > b.duration_ms ? 1 : -1
            );
            reverseSortedTracks = sortedTracks.slice();
            reverseSortedTracks.reverse();

            var addsToOther,
                sortedIndex,
                shortestOtherTrack,
                longestOtherTrack,
                notTooLong,
                notTooShort;
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
            sortedTracks.sort((a, b) =>
                a.duration_ms > b.duration_ms ? 1 : -1
            );
            reverseSortedTracks = sortedTracks.slice();
            reverseSortedTracks.reverse();

            var sortedIndex,
                shortestOtherTracks,
                longestOtherTracks,
                notTooLong,
                notTooShort;
            return tracks.filter((track, trackIndex) => {
                var sortedIndex = _trackIndex(sortedTracks, track);
                var shortestOtherTracks = _sumOfFirst(
                    sortedTracks,
                    minTracks - 1,
                    sortedIndex
                );
                var notTooLong = track.duration_ms + shortestOtherTracks <= max;

                var notTooShort;
                if (maxTracks !== -1) {
                    var longestOtherTracks = _sumOfFirst(
                        reverseSortedTracks,
                        maxTracks - 1,
                        tracks.length - 1 - sortedIndex
                    );
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

    function _generate(
        min,
        max,
        minSongLength,
        maxSongLength,
        minTracks,
        maxTracks,
        inverted = false,
        specifiedTracks = []
    ) {
        generatedPlaylist = [];

        console.log(
            "generating between " +
                min +
                " and " +
                max +
                " length, between " +
                minTracks +
                " and " +
                maxTracks +
                " tracks"
        );

        var timer = Date.now();

        if (tracklist.length === 0) {
            // No tracklist has been set
            window.alert("The chosen source is empty!");
            return [];
        }

        maxSongLength += songSpacing;
        minSongLength += songSpacing;

        if (maxSongLength < minSongLength) {
            window.alert(
                "The minimum song length (" +
                    minSongLength.toHHMMSS() +
                    ") is larger than the maximum song length (" +
                    maxSongLength.toHHMMSS() +
                    ")!"
            );
            return [];
        }

        if (maxTracks !== -1 && minTracks > maxTracks) {
            window.alert(
                "Make sure the minimum number of tracks is not bigger than the maximum number of tracks!"
            );
            return [];
        }

        // filter to songs between min and max song length
        var shuffledTracks = (inverted ? specifiedTracks : tracklist).filter(
            (track) =>
                minSongLength <= track.duration_ms &&
                track.duration_ms <= maxSongLength
        );
        var shuffledTracks = shuffle(shuffledTracks);

        var totalLength = shuffledTracks.reduce(function (prev, cur) {
            return prev + cur.duration_ms;
        }, 0);

        if ((min + max) / 2 == 0 && !inverted) {
            return shuffledTracks;
        }

        if (totalLength < min) {
            window.alert(
                "The chosen source (" +
                    totalLength.toHHMMSS() +
                    ") is too short for the time you requested (" +
                    ((min + max) / 2).toHHMMSS() +
                    ")!"
            );
            return [];
        }

        var sortedTracks = shuffledTracks.slice();
        sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms ? 1 : -1));
        var reverseSortedTracks = sortedTracks.slice();
        reverseSortedTracks.reverse();

        if (
            maxTracks !== -1 &&
            min > _sumOfFirst(reverseSortedTracks, maxTracks)
        ) {
            window.alert(
                "Unable to create a playlist of length " +
                    ((min + max) / 2).toHHMMSS() +
                    " with only " +
                    maxTracks +
                    " track" +
                    (maxTracks === 1 ? "." : "s.")
            );
            return [];
        }

        if (max < _sumOfFirst(sortedTracks, minTracks)) {
            window.alert(
                "Unable to create a playlist of length " +
                    ((min + max) / 2).toHHMMSS() +
                    " with at least " +
                    minTracks +
                    " track" +
                    (minTracks === 1 ? "." : "s.")
            );
            return [];
        }

        // We can raise the actual minimum number of tracks to help with the filtering
        minTracks = Math.max(
            minTracks,
            itemsNeeded(reverseSortedTracks, min).items
        );
        // In the same way, we can lower max tracks
        if (maxTracks !== -1) {
            maxTracks = Math.min(
                maxTracks,
                itemsNeeded(sortedTracks, min).items
            );
        }

        if (maxTracks !== -1 && minTracks > maxTracks) {
            window.alert(
                "Unable to find a combination of songs with that length."
            );
            return [];
        }

        shuffledTracks = _filterTracks(
            shuffledTracks,
            min,
            max,
            minTracks,
            maxTracks
        ); // Find tracks fit in the specified duration

        // Make sorted lists again since some songs were removed
        sortedTracks = shuffledTracks.slice();
        sortedTracks.sort((a, b) => (a.duration_ms > b.duration_ms ? 1 : -1));
        reverseSortedTracks = sortedTracks.slice();
        reverseSortedTracks.reverse();

        totalLength = shuffledTracks.reduce(function (prev, cur) {
            return prev + cur.duration_ms;
        }, 0);

        console.log("filter phase: " + (Date.now() - timer));
        timer = Date.now();
        console.log(
            "After filtering we have a list of " +
                shuffledTracks.length +
                " tracks, with length " +
                totalLength
        );
        console.log(shuffledTracks);

        if (totalLength < min) {
            window.alert(
                "Unable to find a combination of songs with that length."
            );
            return [];
        } else if (shuffledTracks.length === 0 && min <= 0 && 0 <= max) {
            // No possible songs, but a playlist of length 0 is allowed
            return [];
        } else if (min + max > totalLength) {
            // Average of min and max is greater than half the total length
            var newMinTracks =
                maxTracks === -1 ? 0 : shuffledTracks.length - maxTracks;
            var newMaxTracks =
                minTracks === 0 ? -1 : shuffledTracks.length - minTracks;
            generatedPlaylist = _generate(
                totalLength - max,
                totalLength - min,
                minSongLength,
                maxSongLength,
                newMinTracks,
                newMaxTracks,
                true,
                shuffledTracks
            ); // generate an "inverted" playlist of songs to exclude, resulting in a playlist of the desired length
            if (generatedPlaylist == null) {
                // Inverted playlist failed
                window.alert(
                    "Unable to find a combination of songs with that length."
                );
                return [];
            }
            return shuffledTracks.filter(
                (track) => !generatedPlaylist.includes(track)
            );
        }

        if (shuffledTracks.length == 0) {
            if (inverted) return null; // return null to avoid confusion with the empty playlist []

            sortedTracks = filteredList.slice();
            sortedTracks.sort((a, b) =>
                a.duration_ms > b.duration_ms ? 1 : -1
            );

            if (minTracks === 0 && maxTracks === -1) {
                window.alert(
                    "The time you requested (" +
                        ((min + max) / 2).toHHMMSS() +
                        ") is shorter than the shortest song available (" +
                        sortedTracks[0].duration_ms.toHHMMSS() +
                        ")!"
                );
            } else {
                window.alert(
                    "Unable to find a combination of songs with that length."
                );
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
                var selectedIndex =
                    canSwap[Math.floor(Math.random() * canSwap.length)];
                var selectedDuration =
                    shuffledTracks[selectedIndex].duration_ms;

                var completedSwap = false;

                for (const otherIndex of availableIndexes) {
                    if (
                        shuffledTracks[otherIndex].duration_ms <
                        selectedDuration
                    ) {
                        duration -= selectedDuration;
                        duration += shuffledTracks[otherIndex].duration_ms;
                        var temp = shuffledTracks[selectedIndex];
                        shuffledTracks[selectedIndex] =
                            shuffledTracks[otherIndex];
                        shuffledTracks[otherIndex] = temp;

                        while (duration < min) {
                            // We can now fit in a new song, adjust items and duration
                            duration += shuffledTracks[items].duration_ms;
                            availableIndexes.splice(
                                availableIndexes.indexOf(items),
                                1
                            ); // can no longer swap with this item
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
                var selectedIndex =
                    canSwap[Math.floor(Math.random() * canSwap.length)];
                var selectedDuration =
                    shuffledTracks[selectedIndex].duration_ms;

                var completedSwap = false;

                for (const otherIndex of availableIndexes) {
                    if (
                        shuffledTracks[otherIndex].duration_ms >
                        selectedDuration
                    ) {
                        duration -= selectedDuration;
                        duration += shuffledTracks[otherIndex].duration_ms;
                        var temp = shuffledTracks[selectedIndex];
                        shuffledTracks[selectedIndex] =
                            shuffledTracks[otherIndex];
                        shuffledTracks[otherIndex] = temp;

                        while (duration > min) {
                            // We can now remove a new song, adjust items and duration
                            items--;
                            duration -= shuffledTracks[items].duration_ms;
                            canSwap.splice(canSwap.indexOf(items), 1); // can no longer swap with this item
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
        console.log(
            "ready for adjustments, we have a playlist with " +
                items +
                " tracks and length " +
                duration
        );

        if (duration <= max && minTracks <= items && items <= maxTracks) {
            // min <= duration <= max, so we can return the playlist as is
            return shuffledTracks.slice(0, items);
        }

        var remainingMin, remainingMax;
        var minNeededSongs, maxNeededSongs;
        var tracksToAddDuration;
        var filteredTracks;
        var succeeded = false;

        timer = Date.now();
        console.log(
            "attempting swap to get " +
                (min - duration) +
                " to " +
                (max - duration)
        );
        if (
            getSwaps(
                shuffledTracks,
                items,
                1,
                1,
                min - duration,
                max - duration
            )
        ) {
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

            minNeededSongs = itemsNeeded(
                reverseSortedTracks,
                remainingMin
            ).items; // lowest possible number of songs to add
            maxNeededSongs = itemsNeeded(sortedTracks, remainingMax).items; // highest possible number of songs to add

            minNeededSongs = Math.max(minTracks - items, minNeededSongs); // We need to reach the minimum amount of tracks
            if (maxTracks !== -1) {
                maxNeededSongs = Math.min(maxTracks - items, maxNeededSongs); // Ensure we are under maximum amount of tracks
            }

            for (
                var songsToAdd = minNeededSongs;
                songsToAdd <= maxNeededSongs;
                songsToAdd++
            ) {
                // Assuming we are adding songsToAdd more songs, which tracks could work to reach this length
                filteredTracks = _filterTracks(
                    shuffledTracks.slice(items),
                    remainingMin,
                    remainingMax,
                    songsToAdd,
                    songsToAdd
                );

                // Go through all permutations and call the following function on each
                succeeded = getPermutations(filteredTracks, songsToAdd).some(
                    function (tracksToAdd) {
                        tracksToAddDuration = tracksToAdd.reduce(function (
                            prev,
                            cur
                        ) {
                            return prev + cur.duration_ms;
                        },
                        0);

                        if (
                            remainingMin <= tracksToAddDuration &&
                            tracksToAddDuration <= remainingMax
                        ) {
                            generatedPlaylist = shuffledTracks
                                .slice(0, items)
                                .concat(tracksToAdd);
                            return true;
                        }
                    }
                );

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
        setTracklist(tracks, songSpacing) {
            _setTracklist(tracks, songSpacing);
        },

        generate(min, max, minSongLength, maxSongLength, minTracks, maxTracks) {
            generatedPlaylist = _generate(
                min,
                max,
                minSongLength,
                maxSongLength,
                minTracks,
                maxTracks
            );

            console.log(generatedPlaylist);
            // Shuffle the playlist and adjust the duration of each song to account for song spacing
            generatedPlaylist = shuffle(generatedPlaylist).map((track) => {
                return {
                    ...track,
                    duration_ms: track.duration_ms - songSpacing,
                };
            });
            console.log(generatedPlaylist);
            return generatedPlaylist;
        },

        shufflePlaylist() {
            generatedPlaylist = shuffle(generatedPlaylist);
        },

        getNumTracks() {
            return generatedPlaylist == null ? 0 : generatedPlaylist.length;
        },

        getDuration() {
            return generatedPlaylist == null
                ? 0
                : generatedPlaylist.reduce(function (prev, cur) {
                      return prev + cur.duration_ms + songSpacing;
                  }, 0);
        },

        isFirstTrack(id) {
            return id === generatedPlaylist[0].id;
        },

        getTimeRemaining(id, progress) {
            var trackIndex = generatedPlaylist.findIndex(
                (track) => track.id === id
            );
            return generatedPlaylist == null
                ? 0
                : generatedPlaylist
                      .slice(trackIndex)
                      .reduce(function (prev, cur) {
                          return prev + cur.duration_ms + songSpacing;
                      }, 0) - progress;
        },
    };
})();
