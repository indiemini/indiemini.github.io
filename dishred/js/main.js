const MAX_TIME = 35;
var words = null;
var correctWord = null;
var correctIndex = -1;
var timer = null;
var maxTime = MAX_TIME;
var timeLeft = MAX_TIME;
var subTimer = null;
var subTimeTaken = 0;
var score = 0;
var playing = true;
var ready = false;
var gameoverStall = false;
var playPending = false;
var canvas = null;
var ctx = null;

function onStart() {
    // let's snag our wordlist.
    fetch("assets/google-10000-english-no-swears.txt")
        .then(r => r.text())
        .then(t => onWords(t));
    // also, let's prep the canvas.
    canvas = $("#timer-canvas");
    ctx = canvas.getContext("2d");
    window.requestAnimationFrame(draw);
}

function draw(timestamp) {
    // scale canvas to match "true" size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // this is specifically used for the timer effect.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // first, let's consider "progress."
    let progress = timeLeft / maxTime;
    if (progress >= 1) progress = 0.999;
    if (progress < 0) progress = 0;
    // next, let's figure out what the "total"
    // length would be, if the progress was 1.
    let maxLength = 2 * (canvas.width + canvas.height);
    // so, the current length...
    let currentLength = progress * maxLength;
    // next, let's start drawing the path
    // by drawing as many complete segments as we can.
    let calcedLength = 0;
    let completeSegments = Math.floor(progress * 4);
    let diff = (progress * 4) - completeSegments;
    if (completeSegments % 2 == 0)
        calcedLength = diff * canvas.height;
    else
        calcedLength = diff * canvas.width;

    ctx.beginPath();
    // set rules
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#CCCCCCFF";
    ctx.imageSmoothingEnabled = false;
    // draw the complete segments
    for (var i = 0; i < completeSegments; i++) {
        if (i % 2 == 0) {
            // height
            if (i == 0) {
                ctx.moveTo(canvas.width - 1, 0);
                ctx.lineTo(canvas.width - 1, canvas.height - 1);
            }
            if (i == 2) {
                ctx.moveTo(0, canvas.height - 1);
                ctx.lineTo(0, 0);
            }
        }
        else {
            // width
            if (i == 1) {
                ctx.moveTo(canvas.width - 1, canvas.height - 1);
                ctx.lineTo(0, canvas.height - 1);
            }
            if (i == 3) {
                ctx.moveTo(0, 0);
                ctx.lineTo(canvas.width - 1, 0);
            }
        }
    }

    // todo: draw incomplete segment
    if (completeSegments % 2 == 0) {
        // height
        if (completeSegments == 0) {
            ctx.moveTo(canvas.width - 1, 0);
            ctx.lineTo(canvas.width - 1, calcedLength);
        }
        if (completeSegments == 2) {
            ctx.moveTo(0, canvas.height - 1);
            ctx.lineTo(0, canvas.height - 1 - calcedLength);
        }
    }
    else {
        // width
        if (completeSegments == 1) {
            ctx.moveTo(canvas.width - 1, canvas.height - 1);
            ctx.lineTo(canvas.width - 1 - calcedLength, canvas.height - 1);
        }
        if (completeSegments == 3) {
            ctx.moveTo(0, 0);
            ctx.lineTo(calcedLength, 0);
        }
    }

    // draw the path.
    ctx.closePath();
    ctx.stroke();
    
    // queue up next frame.
    window.requestAnimationFrame(draw);
}

function advanceTutorial(currentIndex) {
    if (currentIndex == -1) {
        if ($("#click-to-start-text").className == "hide") {
            // we've already been here. let's not do it again
            return;
        }
        $("#click-to-start-text").className = "hide";
        $("#top-banner-obj").className = "top-banner"; // remove clickable
        $(`#tutorial-pt-${currentIndex + 1}`).className = "tutorial"; // remove hide
    }
    else if (currentIndex == 5) {
        $(`#tutorial-pt-${currentIndex}`).className = "tutorial hide"; // add hide
        $("#game").className = "main-content"; // remove hide
        // forcefully play the first time.
        if (ready) {
            playing = false;
            playAgain();
        }
        else {
            playPending = true;
        }
    }
    else {
        $(`#tutorial-pt-${currentIndex}`).className = "tutorial hide"; // add hide
        $(`#tutorial-pt-${currentIndex + 1}`).className = "tutorial"; // remove hide
    }
}

function playAgain() {
    if (playing) return;
    if (gameoverStall) return;
    // remove clickable class
    $("#main-container").className = "container";
    $("#game-over-text").textContent = "";
    startTimer("reset");
    startSubTimer();
    newWord();
}

function getRandomExcept(max, ...numbers) {
    let avoidCount = numbers.length;
    let rndMax = max - avoidCount;
    var rnd = Math.floor(Math.random() * rndMax);
    // numbers must be sorted for this to succeed
    numbers.sort((a, b) => a - b);
    for (let number of numbers) {
        if (rnd >= number)
            rnd++;
    }
    return rnd;
}

function getRandomWord() {
    var rnd = Math.floor(Math.random() * words.length);
    return words[rnd];
}

function getHidden(word) {
    // choose which letters to hide
    // don't hide the first two letters
    // or the last two letters
    let avoid = [0, 1, word.length - 1, word.length - 2];
    let hide = [];
    // choose three more letters to avoid (these are the ones we hide)
    for (var i = 0; i < 3; i++) {
        const hideIndex = getRandomExcept(word.length, ...avoid);
        avoid.push(hideIndex);
        hide.push(hideIndex);
    }
    // sort the hidden indices
    hide.sort((a, b) => a - b);

    // console.log(avoid);
    // console.log(hide);

    // hide characters in the word
    let hiddenWord = word;
    let hiddenChars = "";
    for (let hideIndex of hide) {
        hiddenChars += hiddenWord[hideIndex];
        hiddenWord = setCharAt(hiddenWord, hideIndex, '_');
    }

    return { word: word, hiddenWord: hiddenWord, hiddenChars: hiddenChars };
}

function startTimer() {
    // clear previous timer if necessary.
    clearInterval(timer);
    playing = true;
    maxTime = MAX_TIME;
    timeLeft = MAX_TIME;
    updateTimer();
    // start the timer, updating elements.
    timer = setInterval(() => {
        // console.log(timeLeft);
        if ((timeLeft -= 0.01) < 0) {
            // game over!
            // todo: game over lol
            clearInterval(timer);
            updateTimer("gameover");
            playing = false;
        }
        else {
            updateTimer();
        }
    }, 10);
}
function updateTimer(highlightType = "") {
    // $("#timer").textContent = `${Math.round(timeLeft)}...`;
    if (highlightType == "wrong") {

    }
    else if (highlightType == "bonus") {

    }
    else if (highlightType == "reset") {

    }
    else if (highlightType == "gameover") {
        // $("#score-counter").textContent = `gg! try again? (click anywhere)`;
        $("#last-word").textContent = `gg! the word was: ${correctWord}.`;
        gameoverStall = true;
        setTimeout(() => {
            $("#main-container").className = "container clickable";
            $("#game-over-text").textContent = `try again? (click anywhere)`;
            gameoverStall = false;
        }, 500);
    }
}
function startSubTimer() {
    // clear previous timer if necessary.
    clearInterval(subTimer);
    subTimeTaken = 0;
    // start the timer, updating elements.
    subTimer = setInterval(() => {
        subTimeTaken++;
    }, 1000);
}

function newWord() {
    // get a random word
    let word = getRandomWord();
    let data = getHidden(word);

    // to populate the "bad" guesses,
    // let's just generate other words,
    // and use *their* hidden data.
    // this makes the options more believable
    // then just randomly generating letters.
    var opts = [data.hiddenChars];
    for (var i = 0; i < 2; i++) {
        let wrongWord = getRandomWord();
        let wrongData = getHidden(wrongWord);
        opts.push(wrongData.hiddenChars);
    }
    shuffle(opts);

    $("#word-hint").textContent = data.hiddenWord;
    for (var i = 0; i < 3; i++) {
        let guess = $$(".guess")[i];
        let guessContent = opts[i];
        guess.textContent = guessContent;
    }

    correctWord = word;
    correctIndex = opts.indexOf(data.hiddenChars);
}

function onWords(text) {
    words = text.split('\n');
    words = words.filter(w => w.length >= 8);

    ready = true;

    // play if we aren't already playing?
    if (playPending) {
        // forcefully play
        playing = false;
        playAgain();
    }
}

function onGuess(index) {
    if (!playing) return;
    // with each guess, let's take
    // a little bit away from maxTime
    maxTime -= 0.2;
    // but let's make sure the game is still playable!
    if (maxTime < 15)
        maxTime = 15;
    if (index == correctIndex) {
        console.log(`EASY! Took ${subTimeTaken} seconds.`);
        $("#last-word").textContent = `${correctWord}`;
        let timeTaken = subTimeTaken;
        if (timeTaken <= 3) {
            // add time back depending on how fast it was guessed
            // todo: combos? (several fast guesses in a row => higher than 5s back)
            let addBack = 3 - timeTaken;
            timeLeft += addBack;
            if (timeLeft > maxTime)
                timeLeft = maxTime;
            updateTimer("bonus");
        }
        else {
            // small add back to make
            // correct guesses feel better!
            let addBack = 0.5;
            timeLeft += addBack;
            if (timeLeft > maxTime)
                timeLeft = maxTime;
            updateTimer("bonus");
        }
        score++;
        $("#score-counter").textContent = `Score: ${score}`;
        startSubTimer();
        newWord();
    }
    else {
        // WRONG! lose some time.
        console.log("AAAAAAAAAAAAAFKC");
        timeLeft -= 3;
        // increase subTimeTaken
        // to prevent player from re-gaining this time
        subTimeTaken += 5;
        if (timeLeft > 0)
            updateTimer("wrong");
        else
            updateTimer("gameover");
    }
}

function test() {
    if (words == null) {
        console.log("not ready yet");
        return;
    }
    var rnd = Math.floor(Math.random() * words.length);
    console.log(words[rnd]);
}

onStart();