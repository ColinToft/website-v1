var i = 0;
var j = 0;

function update() {
    var title = "BLACK SILENCE";
    var subtitle = "by Colin Toft"
    if (i < title.length) {
        document.getElementById("title").textContent += title.charAt(i++);
    } else if (i > title.length + 2) {
        if (j < subtitle.length) {
            document.getElementById("subtitle").textContent += subtitle.charAt(j++);
        } else if (j == subtitle.length + 4) {
            document.getElementById("playButton").classList.toggle("fade");
            j++
        } else {
            j++;
        }
    } else {
        i++;
    }
}

function clicked() {
    document.getElementById("title").classList.toggle("fade");
    document.getElementById("subtitle").classList.toggle("fade");
    document.getElementById("playButton").classList.toggle("fade");
}

window.setInterval(update, 73);