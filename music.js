var guitar = _tone_0253_Acoustic_Guitar_sf2_file;
var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var output = audioContext.destination;
var player = new WebAudioFontPlayer();
var now = 0;

var C = 0, Cs = 1, D = 2, Ds = 3, E = 4, F = 5, Fs = 6, G = 7, Gs = 8, A = 9, As = 10, B = 11;
var octave = [C, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B];

var fretsAm = [-1, 0, 2, 2, 1, 0];
var fretsC =  [-1, 3, 2, 0, 1, 0];
var fretsE =  [ 0, 2, 2, 1, 0, 0];
var fretsG =  [ 3, 2, 0, 0, 0, 3];
var fretsDm = [-1,-1, 0, 2, 3, 1];
player.loader.decodeAfterLoading(audioContext, '_tone_0253_Acoustic_Guitar_sf2_file');

// 12 halfsteps per octave * 4 octaves
var baseOctave = 12*4;
function majorChord(startInd)
{
    var p = [];
    p.push(startInd + baseOctave);
    p.push(startInd + baseOctave + 4);
    p.push(startInd + baseOctave + 7);
    return p;
}
function minorChord(startInd)
{
    var p = [];
    p.push(startInd + baseOctave);
    p.push(startInd + baseOctave + 3);
    p.push(startInd + baseOctave + 7);
    return p;
}

function cancel(){
    if (timer != null)
    {
        // stop requeueing
        clearInterval(timer);
    }
    player.cancelQueue(audioContext);
}

function playMajor(chord, duration, afterTime)
{
    // javascript typing is magic
    var parts = majorChord(chord);
    var time = afterTime + audioContext.currentTime;
    player.queueChord(audioContext, output, guitar, time, parts, duration);
}

function playMinor(chord, duration, afterTime)
{
    // javascript typing is magic
    var parts = minorChord(chord);
    var time = afterTime + audioContext.currentTime;
    player.queueChord(audioContext, output, guitar, time, parts, duration);
}

var timer = null;
var lastRun = 0;
var shouldPlayUpDown = false;
function toggleMelody()
{
    shouldPlayUpDown = !shouldPlayUpDown;
}
function playUpDownUpDown(baseNote, noteDiff, msBetweenChords, offset)
{
    if (!shouldPlayUpDown) return;
    player.queueChord(audioContext, output, guitar,
        audioContext.currentTime + (0.0 * msBetweenChords) + offset,
        [baseNote + 36], msBetweenChords);
    player.queueChord(audioContext, output, guitar,
        audioContext.currentTime + (1.0 * msBetweenChords) + offset,
        [baseNote + 36 + noteDiff], msBetweenChords);
    player.queueChord(audioContext, output, guitar,
        audioContext.currentTime + (2.0 * msBetweenChords) + offset,
        [baseNote + 36], msBetweenChords);
    player.queueChord(audioContext, output, guitar,
        audioContext.currentTime + (3.0 * msBetweenChords) + offset,
        [baseNote + 36 + noteDiff], msBetweenChords);
}
function playIVVIIV(msBetweenChords = 2000)
{
    // interval * four chords
    let repeatMs = msBetweenChords * 4;
    let beatIntervalDec = msBetweenChords / 1000.0;

    // stop playing any other audio
    cancel();

    // choose a note!
    var noteIndex = Math.ceil(Math.random() * 100) % octave.length;
    var note = octave[noteIndex];
    var noteTwo = octave[(noteIndex + 7) % octave.length];
    var noteThree = octave[(noteIndex + 9) % octave.length];
    var noteFour = octave[(noteIndex + 5) % octave.length];

    // run once before scheduling
    lastRun = Date.now();
    playUpDownUpDown(note, 4, beatIntervalDec/4.0, 0.0);
    playMajor(note, beatIntervalDec, 0.0 * beatIntervalDec);

    playUpDownUpDown(noteTwo, 4, beatIntervalDec/4.0, beatIntervalDec * 1.0);
    playMajor(noteTwo, beatIntervalDec, 1.0 * beatIntervalDec);

    playUpDownUpDown(noteThree, 3, beatIntervalDec/4.0, beatIntervalDec * 2.0);
    playMinor(noteThree, beatIntervalDec, 2.0 * beatIntervalDec);

    playUpDownUpDown(noteFour, 4, beatIntervalDec/4.0, beatIntervalDec * 3.0);
    playMajor(noteFour, beatIntervalDec, 3.0 * beatIntervalDec);

    // repeat forever!
    timer = setInterval(function()
    {
        var deltaTime = Date.now() - lastRun;
        var marginOfErr = deltaTime - repeatMs;
        var t = msBetweenChords - marginOfErr;
        t = t / 1000.0;
        lastRun = Date.now();
        playUpDownUpDown(note, 4, beatIntervalDec/4.0, 0.0);
        playMajor(note, t, 0.0 * beatIntervalDec);

        playUpDownUpDown(noteTwo, 4, beatIntervalDec/4.0, beatIntervalDec * 1.0);
        playMajor(noteTwo, t, 1.0 * beatIntervalDec);

        playUpDownUpDown(noteThree, 3, beatIntervalDec/4.0, beatIntervalDec * 2.0);
        playMinor(noteThree, t, 2.0 * beatIntervalDec);

        playUpDownUpDown(noteFour, 4, beatIntervalDec/4.0, beatIntervalDec * 3.0);
        playMajor(noteFour, t, 3.0 * beatIntervalDec);
    }, repeatMs);
}

function play50sProgression(msBetweenChords = 2000)
{
    // interval * four chords
    let repeatMs = msBetweenChords * 4;
    let beatIntervalDec = msBetweenChords / 1000.0;

    // stop playing any other audio
    cancel();

    // choose a note!
    var noteIndex = Math.ceil(Math.random() * 100) % octave.length;
    var note = octave[noteIndex];
    var noteTwo = octave[(noteIndex + 9) % octave.length];
    var noteThree = octave[(noteIndex + 5) % octave.length];
    var noteFour = octave[(noteIndex + 7) % octave.length];

    // run once before scheduling
    lastRun = Date.now();
    playMajor(note, beatIntervalDec, 0.0 * beatIntervalDec);
    playMinor(noteTwo, beatIntervalDec, 1.0 * beatIntervalDec);
    playMajor(noteThree, beatIntervalDec, 2.0 * beatIntervalDec);
    playMajor(noteFour, beatIntervalDec, 3.0 * beatIntervalDec);

    // repeat forever!
    timer = setInterval(function()
    {
        var deltaTime = Date.now() - lastRun;
        var marginOfErr = deltaTime - repeatMs;
        var t = msBetweenChords - marginOfErr;
        t = t / 1000.0;
        lastRun = Date.now();
        playMajor(note, t, 0.0 * beatIntervalDec);
        playMinor(noteTwo, t, 1.0 * beatIntervalDec);
        playMajor(noteThree, t, 2.0 * beatIntervalDec);
        playMajor(noteFour, t, 3.0 * beatIntervalDec);
    }, repeatMs);
}