import PianoPerformance from '../piano-performance';

const container1 = document.createElement('div');
document.querySelector('body').appendChild(container1);

const title1 = document.createElement('h2');
title1.textContent = 'Jingle Bells';
container1.appendChild(title1);

new PianoPerformance(container1, {
    bpm: 75,
    minNote: 'C4',
    maxNote: 'B5',
    sheetMusic: 'T:4/4 L:1/4 O:4 D B A G D:4 D B A G E:4 E C5 B A F#:4 D5 D5 C5 A B:4',
});

const container2 = document.createElement('div');
document.querySelector('body').appendChild(container2);

const title2 = document.createElement('h2');
title2.textContent = 'Hot Cross Buns';
container2.appendChild(title2);

new PianoPerformance(container2, {
    bpm: 60,
    sheetMusic: 'T:4/4 L:1/4 O:4 E:2 D:2 C:4 E:2 D:2 C:4 C C C C D D D D E:2 D:2 C:4',
});