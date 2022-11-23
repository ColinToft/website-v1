Number.prototype.toHHMMSS = function (round = true) {
    var ms;
    if (round) {
        ms = Math.round(this.valueOf() / 1000) * 1000;
    } else {
        ms = Math.floor(this.valueOf() / 1000) * 1000;
    }

    var hours = Math.floor(ms / 3600000);
    var minutes = Math.floor((ms - hours * 3600000) / 60000);
    var seconds = Math.floor((ms - hours * 3600000 - minutes * 60000) / 1000);

    if (minutes < 10 && hours > 0) {
        minutes = "0" + minutes;
    }
    if (hours === 0) hours = "";
    else {
        hours = hours + ":";
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + minutes + ":" + seconds;
};

String.prototype.titleCase = function () {
    return this.toLowerCase()
        .split(" ")
        .map(function (word) {
            return word.replace(word[0], word[0].toUpperCase());
        })
        .join(" ");
};

AppController.init();
