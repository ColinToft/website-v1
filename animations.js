// When the user scrolls down 80px from the top of the document, resize the navbar's padding and the logo's font size
window.onscroll = function() {scrollFunction()};

var textColor;
var backgroundColor;

var nameCursorOn = false;
var matrixFrame = 0;
var currentWord = 0;
var matrixLength = 0;
var matrixPaused = true;
var matrixFramesToChange = 120;
var matrixFramesPaused = 25;
var matrixFramesPerLetter = 5;
var words = ["Programmer", "Mathematician", "Musician", "Innovator", "Problem Solver", "Big Brother", "Creator", "Thinker"];
var newWord;
var showMenu = true;

var whereIsUser = 0;

var projectsVisible = false;
var educationVisible = false;
var workVisible = false;

function init(){
    /*
    for (var i = 0; i < document.getElementById("navbar").getElementsByClassName("button").length; i++) {
        document.getElementById("navbar").getElementsByClassName("button")[i].addEventListener("mouseenter", function( event ) {
            if (!(document.body.scrollTop > 80 || document.documentElement.scrollTop > 80)) {
                event.target.style.color = textColor;
            }
        });
        
        document.getElementById("navbar").getElementsByClassName("button")[i].addEventListener("mouseleave", function( event ) {
            if (!(document.body.scrollTop > 80 || document.documentElement.scrollTop > 80)) {
                event.target.style.color = "white";

            }
        });
    }*/
    
  window.addEventListener('resize', evt => {

      if(window.innerWidth < 620 && showMenu){
        showMenu = false;
          
        for (const element of document.getElementById("navbar").getElementsByClassName("button")) {
            element.style.display = 'none';
        }

      }else if(window.innerWidth > 680 && !showMenu){
        showMenu = true;
        for (const element of document.getElementById("navbar").getElementsByClassName("button")) {
            element.style.display = 'block';
        }          
      }
    });
    
  textColor = window.getComputedStyle(document.documentElement).getPropertyValue('--text-color');
  backgroundColor = window.getComputedStyle(document.documentElement).getPropertyValue('--background-color');

  window.setInterval(toggleUL, 600);
  window.setInterval(changeText, 30);


}

function isElementInViewport (el) {
    if (typeof jQuery === "function" && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

function smooth(value) {
    if (value <= 0) {
        return 0;
    } else if (value >= 1) {
        return 1;
    } else {
        // return 0.5 * Math.sin(Math.PI * (value - 0.5)) + 0.5;
        return value - 0.05 * Math.sin(2 * Math.PI * value);
    }
}

function changeText(){
    
    if (matrixPaused) {
        if (matrixFrame < matrixFramesPaused) {
            document.getElementById("matrixText").innerHTML = words[currentWord];
            matrixFrame++;
        } else {            
            matrixLength = words[currentWord].length
            currentWord = (++currentWord) % words.length;
            matrixLength = Math.max(matrixLength, words[currentWord].length);
            matrixFrame = 0;
            matrixPaused = false;
        }
    } else {
        if (matrixFrame < matrixFramesToChange) {
            var goalString = words[currentWord];
            var prevString = currentWord == 0 ? words[words.length - 1] : words[currentWord - 1];
            
            var s = "";
            for (var charIndex = 0; charIndex < matrixLength; charIndex++) {
                var goalChar = goalString.length > charIndex ? goalString[charIndex] : " ";
                var prevChar = prevString.length > charIndex ? prevString[charIndex] : " ";
                var progress = smooth((matrixFrame - charIndex * matrixFramesPerLetter) / (matrixFramesToChange - matrixLength * matrixFramesPerLetter));
                //console.log(progress);
                var goalCharCode = goalChar.charCodeAt(0) - 32; // Subtract 32 to account for all the characters below space (32)
                var prevCharCode = prevChar.charCodeAt(0) - 32;
                while (goalCharCode - 20 < prevCharCode) { // 126 is the upper ASCII code of the animation
                    goalCharCode += (126 - 32);
                }
                var curCharCode = Math.ceil(((goalCharCode - prevCharCode) * progress + prevCharCode) % (126 - 32) + 32);
                
                s += curCharCode === 60 ? "&lt;" : String.fromCharCode(curCharCode);
                
            }
            document.getElementById("matrixText").innerHTML = s;
            matrixFrame++;
        } else {
            matrixPaused = true;
            matrixFrame = 0;
        }
    }
}

function toggleUL(){
  if(nameCursorOn){
    document.getElementById("name").innerHTML = ">Colin Toft_";

  }else{
    document.getElementById("name").innerHTML = ">Colin Toft&nbsp;";

  }
  nameCursorOn = !nameCursorOn;
}
function dropdown(x) {
  x.classList.toggle("change");
}

function scrollFunction() {
  if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
    document.getElementById("navbar").style.padding = "12px 10px";
    document.getElementById("navbar").style.background = backgroundColor;
    document.getElementById("navbar").getElementsByClassName("name")[0].style.opacity = 100;
    for (const element of document.getElementById("navbar").getElementsByClassName("button")) {
            element.style.color = textColor;
        }
    document.getElementById("navbar").style.setProperty('-webkit-filter', 'drop-shadow(5px 5px 5px #222)');
  } else {
    document.getElementById("navbar").style.padding = "24px 10px";
    document.getElementById("navbar").style.background = "transparent";
    document.getElementById("navbar").getElementsByClassName("name")[0].style.opacity = 0;
    for (const element of document.getElementById("navbar").getElementsByClassName("button")) {
            element.style.color = 'white';
        }
    document.getElementById("navbar").style.setProperty('-webkit-filter', 'drop-shadow(0px 0px 0px #ffffff)');

  }
    
    var hasActive = false;
    for (const element of document.getElementsByClassName("titleBreak")) {
            if (window.scrollY + window.innerHeight > element.offsetTop + element.offsetHeight && !hasActive) {
                element.classList.add("active");
                hasActive = true;
            } else {
                element.classList.remove("active");
            }
        }
}
