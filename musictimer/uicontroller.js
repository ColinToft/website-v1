const UIController = (function () {
    const DOMElements = {
        lengthH: "#h",
        lengthM: "#m",
        lengthS: "#s",
        lengthRange: "#lengthRange",
        minSongLengthM: "#minSongLengthM",
        minSongLengthS: "#minSongLengthS",
        maxSongLengthM: "#maxSongLengthM",
        maxSongLengthS: "#maxSongLengthS",
        minTracks: "#minTracks",
        maxTracks: "#maxTracks",
        selectSourceType: "#select_source_type",
        selectSourceItem: "#select_source_item",
        itemInputPrompt: "#item_input_prompt",
        rangeInputPrompt: "#range_input_prompt",
        info: "#info",
        featureMin: "#feature_min",
        featureMax: "#feature_max",
        buttonPlay: "#btn_play",
        buttonSave: "#btn_save",
        buttonRegenerate: "#btn_regenerate",
        buttonShuffle: "#btn_shuffle",
        buttonLogin: "#btn_login",
        buttonLogout: "#btn_logout",
        divSongList: ".song-list",
        trackClass: ".list-group-item",
        hfToken: "#hidden_token",
    };

    var currentTrack = null;

    var backgroundOpacity = 1.0;

    function _makeTrackActive(id) {
        if (document.getElementById(id) !== null) {
            document.getElementById(id).classList.add("active");
            document.getElementById(id).style.backgroundColor = "#007bff";
        }
    }

    function _makeTrackUnactive(id) {
        if (document.getElementById(id) !== null) {
            document.getElementById(id).classList.remove("active");
            document.getElementById(id).style.backgroundColor = "#ffffff";

            var t = document
                .getElementById(id)
                .querySelector("#trackNameAndDuration")
                .querySelector("#trackDuration").innerHTML;
            if (
                t.lastIndexOf("/") !== -1 &&
                t.lastIndexOf("/") > t.lastIndexOf("(")
            ) {
                t =
                    t.substr(0, t.lastIndexOf("(") + 1) +
                    t.substr(t.lastIndexOf("/") + 1);
            }
            document
                .getElementById(id)
                .querySelector("#trackNameAndDuration")
                .querySelector("#trackDuration").innerHTML = t;
        }
    }

    function _setCurrentTrack(id) {
        if (id === currentTrack) {
            return false;
        }

        _makeTrackUnactive(currentTrack);
        _makeTrackActive(id);
        currentTrack = id;
        return true;
    }

    function _setTrackProgress(progress) {
        if (currentTrack == null) {
            return;
        }
        if (document.getElementById(currentTrack)) {
            var t = document
                .getElementById(currentTrack)
                .querySelector("#trackNameAndDuration")
                .querySelector("#trackDuration").innerHTML;

            if (
                t.lastIndexOf("/") !== -1 &&
                t.lastIndexOf("/") > t.lastIndexOf("(")
            ) {
                t =
                    t.substr(0, t.lastIndexOf("(") + 1) +
                    progress +
                    t.substr(t.lastIndexOf("/"));
            } else {
                t =
                    t.substr(0, t.lastIndexOf("(") + 1) +
                    progress +
                    "/" +
                    t.substr(t.lastIndexOf("(") + 1);
            }

            document
                .getElementById(currentTrack)
                .querySelector("#trackNameAndDuration")
                .querySelector("#trackDuration").innerHTML = t;
        }
    }

    function _isDisplayingTrack(id) {
        return document.getElementById(id) !== null;
    }

    function _backgroundFade() {
        backgroundOpacity -= 0.04;
        for (const track of document.querySelectorAll(DOMElements.trackClass)) {
            track.style.backgroundColor =
                "rgba(179, 230, 230, " + backgroundOpacity + ")";
        }

        if (backgroundOpacity >= 0) {
            setTimeout(_backgroundFade, 10);
        }
    }

    return {
        inputField() {
            return {
                length:
                    (parseFloat(
                        document.querySelector(DOMElements.lengthH).value
                    ) || 0) *
                        3600000 +
                    (parseFloat(
                        document.querySelector(DOMElements.lengthM).value
                    ) || 0) *
                        60000 +
                    (parseFloat(
                        document.querySelector(DOMElements.lengthS).value
                    ) || 0) *
                        1000,
                lengthRange: document.querySelector(DOMElements.lengthRange)
                    .value
                    ? parseFloat(
                          document.querySelector(DOMElements.lengthRange).value
                      ) * 1000
                    : -1,
                minSongLength:
                    (parseFloat(
                        document.querySelector(DOMElements.minSongLengthM).value
                    ) || 0) *
                        60000 +
                    (parseFloat(
                        document.querySelector(DOMElements.minSongLengthS).value
                    ) || 0) *
                        1000,
                maxSongLength:
                    (parseFloat(
                        document.querySelector(DOMElements.maxSongLengthM).value
                    ) || 0) *
                        60000 +
                    (parseFloat(
                        document.querySelector(DOMElements.maxSongLengthS).value
                    ) || 0) *
                        1000,
                minTracks:
                    parseInt(
                        document.querySelector(DOMElements.minTracks).value
                    ) || 0,
                maxTracks:
                    parseInt(
                        document.querySelector(DOMElements.maxTracks).value
                    ) || 0,
                selectSourceType: document.querySelector(
                    DOMElements.selectSourceType
                ),
                selectSourceItem: document.querySelector(
                    DOMElements.selectSourceItem
                ),
                itemInputPrompt: document.querySelector(
                    DOMElements.itemInputPrompt
                ),
                rangeInputPrompt: document.querySelector(
                    DOMElements.rangeInputPrompt
                ),
                info: document.querySelector(DOMElements.info),
                featureMin: document.querySelector(DOMElements.featureMin),
                featureMax: document.querySelector(DOMElements.featureMax),
                play: document.querySelector(DOMElements.buttonPlay),
                save: document.querySelector(DOMElements.buttonSave),
                regenerate: document.querySelector(
                    DOMElements.buttonRegenerate
                ),
                shuffle: document.querySelector(DOMElements.buttonShuffle),
                login: document.querySelector(DOMElements.buttonLogin),
                logout: document.querySelector(DOMElements.buttonLogout),
                tracks: document.querySelector(DOMElements.divSongList),
                hfToken: document.querySelector(DOMElements.hfToken),
            };
        },

        addSourceItem(text, value) {
            const html = '<option value="' + value + '">' + text + "</option>";
            document
                .querySelector(DOMElements.selectSourceItem)
                .insertAdjacentHTML("beforeend", html);
        },
        createTrack(id, index, name, artist, length) {
            const html =
                '<a href="#" class="list-group-item list-group-item-action" id="' +
                id +
                '">' +
                '<div id="trackNameAndDuration" class="d-flex w-100 justify-content-between">' +
                '<h6 class="mb-1">' +
                name +
                "</h6>" +
                '<small id="trackDuration">' +
                length.toHHMMSS() +
                "</small>" +
                "</div>" +
                '<div class="d-flex w-100 justify-content-between">' +
                '<p class="mb-0">' +
                artist +
                "</p>" +
                '<div class="listenOnSpotify">' +
                '<button type="button" class="btn" onclick="window.open(\'https://open.spotify.com/track/' +
                id +
                "', '_blank')\";><i class=\"fab fa-spotify\"></i></button>" +
                "</div>" +
                "</div>" +
                "</a>";
            document
                .querySelector(DOMElements.divSongList)
                .insertAdjacentHTML("beforeend", html);
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
            this.inputField().tracks.innerHTML = "";
        },
        resetSourceItems() {
            this.inputField().selectSourceItem.innerHTML = "";
            this.resetTracks();
        },
        resetRangeInputs() {
            this.inputField().featureMin.value = "";
            this.inputField().featureMin.value = "";
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
        },
    };
})();
