export function noteHasSharp(note) {
    return 'CDFGA'.includes(note[0]);
};

export function nextNote(note) {
    let letter, sharp = false, octave;

    if (!note?.length) {
        console.log(note);
    }

    if (note.length === 3) {
        [ letter, sharp, octave ] = note;
        sharp = sharp === '#';
    } else {
        [ letter, octave ] = note;
    }

    if (!sharp && noteHasSharp(note)) {
        sharp = '#';
    } else {
        sharp = '';
        if (letter === 'B') {
            octave = +octave + 1 + '';
        }

        letter = String.fromCharCode((letter.charCodeAt(0) - 64) % 7 + 65);
    }

    return letter + sharp + octave;
};

export function getLedgerDistance(note1, note2) {
    const n1 = (note1.charCodeAt(0) - 65 - 2 + 7) % 7 + (+(note1[2] || note1[1]) * 7);
    const n2 = (note2.charCodeAt(0) - 65 - 2 + 7) % 7 + (+(note2[2] || note2[1]) * 7);
    return n2 - n1;
};

function getSemiTonalValue(note) {
    const semiTonalMap = {
        'C': 0,
        'C#': 1,
        'D': 2,
        'D#': 3,
        'E': 4,
        'F': 5,
        'F#': 6,
        'G': 7,
        'G#': 8,
        'A': 9,
        'A#': 10,
        'B': 11
    };

    return semiTonalMap[note[0] + (note[1] === '#' ? '#' : '')];
}

export function getSemiTonalDistance(note1, note2) {
    const n1 = getSemiTonalValue(note1) + (+(note1[2] || note1[1]) * 12);
    const n2 = getSemiTonalValue(note2) + (+(note2[2] || note2[1]) * 12);
    return n2 - n1;
}