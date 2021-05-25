const MAX_TIME = 35;
const MIN_TIME = 3;
const EXTRA_UI_TIME = 0.6;
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
let lastTimestamp = 0;
let lastBonusTime = -1000;
let lastBonusPerc = 0;
let lastLossTime = -1000;
let lastLossPerc = 0;

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

function getSection(percentage) {
    if (percentage < 0.25)
        return {start: {x: canvas.width - 1, y: 0}, end: {x: canvas.width - 1, y: canvas.height - 1}};
    else if (percentage < 0.5)
        return {start: {x: canvas.width - 1, y: canvas.height - 1}, end: {x: 0, y: canvas.height - 1}};
    else if (percentage < 0.75)
        return {start: {x: 0, y: canvas.height - 1}, end: {x: 0, y: 0}};
    else //if (percentage <= 1)
        return {start: {x: 0, y: 0}, end: {x: canvas.width - 1, y: 0}};
}
function getCoords(percentage) {
    let section = getSection(percentage);

    let multip = percentage * 4;
    let distToNext = (Math.floor(multip) - multip);

    // get distances
    let dx = section.end.x - section.start.x;
    let dy = section.end.y - section.start.y;

    // apply fixed distances
    dx *= -(distToNext);
    dy *= -(distToNext);
    
    // all done!
    return {x: section.start.x + dx, y: section.start.y + dy };
}
function drawLineSegment(start, end, color) {

    // let's start drawing the path
    ctx.beginPath();
    
    // apply the color and other styling
    ctx.lineWidth = 20;
    ctx.strokeStyle = color;//"#CCCCCCFF";
    ctx.imageSmoothingEnabled = false;

    // get the bounds of the start coords, by the start%
    let startCoords = getCoords(start);
    // get the bounds of the end coords, by the end%
    let endCoords = getCoords(end);

    // if (Math.random() < 0.2)
    //     console.log(endCoords);

    // draw the first line segment.
    let startRegion = getSection(start);
    let startSnapped = Math.ceil(start * 4) / 4;
    if (startCoords.x != startRegion.start.x || startCoords.y != startRegion.start.y) {
        ctx.moveTo(startCoords.x, startCoords.y);
        if (end - start < startSnapped - start) {
            ctx.lineTo(endCoords.x, endCoords.y);
        }
        else {
            ctx.lineTo(startRegion.end.x, startRegion.end.y);
        }
        // if (Math.random() < 0.1) {
        //     console.log(`drew start coords: ${startCoords.x},${startCoords.y}`);
        //     console.log(`regioncoords: ${startRegion.end.x},${startRegion.end.y}`);
        // }
    }
    // else {
    //     if (Math.random() < 0.1)
    //         console.log("skipped drawing start.");
    // }

    // // draw the next line segment(s), if necessary.
    let next = Math.ceil(start * 4) / 4;
    let endSnapped = Math.floor(end * 4) / 4;
    while (next < endSnapped) {
        let nextRegion = getSection(next);
        ctx.moveTo(nextRegion.start.x, nextRegion.start.y);
        ctx.lineTo(nextRegion.end.x, nextRegion.end.y);
        next += 0.25;
    }

    // draw the finishing line segment.
    let endRegion = getSection(end);
    if (endCoords.x != endRegion.start.x || endCoords.y != endRegion.start.y) {
        if (end - start < end - endSnapped) {
            ctx.moveTo(startCoords.x, startCoords.y);
        }
        else {
            ctx.moveTo(endRegion.start.x, endRegion.start.y);
        }
        ctx.lineTo(endCoords.x, endCoords.y);
    }
    // else {
    //     if (Math.random() < 0.1)
    //         console.log("skipped drawing end.");
    // }

    // draw the path.
    ctx.closePath();
    ctx.stroke();
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

    // Store dt in seconds
    let deltaTime = (timestamp - lastTimestamp) / 1000;
    // Store last timestamp
    lastTimestamp = timestamp;

    // Draw main time UI
    drawLineSegment(0, progress, "#CCCCCCFF");

    // Draw +time UI
    let bonusTimeElapsed = (timestamp - lastBonusTime) / 1000;
    if (bonusTimeElapsed < EXTRA_UI_TIME) {
        let alpha = 1 - (bonusTimeElapsed / EXTRA_UI_TIME);
        let alpha255 = Math.round(alpha * 255);
        let alphaStr = alpha255.toString(16).padStart(2, '0');
        drawLineSegment(lastBonusPerc, progress, "#008F51" + alphaStr)
    }

    // Draw -time UI
    let lossTimeElapsed = (timestamp - lastLossTime) / 1000;
    if (lossTimeElapsed < EXTRA_UI_TIME) {
        let alpha = 1 - (lossTimeElapsed / EXTRA_UI_TIME);
        let alpha255 = Math.round(alpha * 255);
        let alphaStr = alpha255.toString(16).padStart(2, '0');
        drawLineSegment(progress, lastLossPerc, "#A32900" + alphaStr)
    }
    
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
    // reset score and start timers
    $("#score-counter").textContent = `Score: ${score = 0}`;
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
function updateTimer(highlightType = "", extraData) {
    // $("#timer").textContent = `${Math.round(timeLeft)}...`;
    if (highlightType == "wrong") {
        // a cool thing: we can simply preserve
        // the last perc if this is a consecutive action!
        if (((lastTimestamp - lastLossTime) / 1000) > EXTRA_UI_TIME) {
            lastLossPerc = extraData;
        }
        // store latest timestamp
        lastLossTime = lastTimestamp;

        // clear out bonus color
        lastBonusTime = -1000;
    }
    else if (highlightType == "bonus") {
        // a cool thing: we can simply preserve
        // the last perc if this is a consecutive action!
        if (((lastTimestamp - lastBonusTime) / 1000) > EXTRA_UI_TIME)
            lastBonusPerc = extraData;

        // store latest timestamp
        lastBonusTime = lastTimestamp;

        // clear out wrong color
        lastLossTime = -1000;
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
    // clear info text
    $("#game-over-text").textContent = "";
    // store current progress
    let prog = timeLeft / maxTime;
    if (prog >= 1) prog = 0.999;
    if (prog < 0) prog = 0;
    // with each guess, let's take
    // a little bit away from maxTime
    maxTime -= 0.5;
    // but let's make sure the game is still playable!
    if (maxTime < MIN_TIME)
        maxTime = MIN_TIME;
    if (index == correctIndex) {
        console.log(`EASY! Took ${subTimeTaken} seconds.`);
        $("#last-word").textContent = `${correctWord}`;
        let timeTaken = subTimeTaken;
        if (timeTaken <= 3) {
            // add time back depending on how fast it was guessed
            // todo: combos? (several fast guesses in a row => higher than 5s back)
            let addBack = 5 - (timeTaken / 2);
            timeLeft += addBack;
            if (timeLeft > maxTime)
                timeLeft = maxTime;
            if (timeTaken < 1) {
                $("#game-over-text").textContent = `+1 for speed`;
                score++;
            }
            updateTimer("bonus", prog);
        }
        else {
            // small add back to make
            // correct guesses feel better!
            let addBack = 3;
            timeLeft += addBack;
            if (timeLeft > maxTime)
                timeLeft = maxTime;
            updateTimer("bonus", prog);
        }
        score++;
        $("#score-counter").textContent = `Score: ${score}`;
        startSubTimer();
        newWord();
    }
    else {
        // WRONG! lose some time.
        console.log("AAAAAAAAAAAAAFKC");
        // first, max time moves down
        maxTime -= 3;
        // but let's make sure the game is still playable!
        if (maxTime < MIN_TIME)
            maxTime = MIN_TIME;
        // now, also just reduce time left
        let toReduce = Math.min(0.75 * timeLeft, 7);
        // lose 75% of your remaining time or 5s, whichever is lower
        timeLeft -= toReduce;
        // increase subTimeTaken
        // to prevent player from re-gaining this time
        subTimeTaken += 5;
        if (timeLeft > 0)
            updateTimer("wrong", prog);
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