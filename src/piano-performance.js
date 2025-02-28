import Keyboard from "./keyboard";
import { getLedgerDistance } from "./note-math";
import { trebbleClef } from "./svg-paths";

function parseSheetMusic(sheetMusic) { // ABC notation
    const pieces = sheetMusic.toUpperCase().split(' ');
    const parsed = [];
    
    let barSize = null;
    let defaultNoteLength = 0.25;
    let defaultOctave = null;
    let minNote = null;
    let maxNote = null;

    pieces.forEach(piece => {
        const [letter, value] = piece.split(':');

        if (letter === 'L') {
            const [num, denom] = value.split('/');
            defaultNoteLength = +num / (+denom || 1);
        } else if (letter === 'O') {
            defaultOctave = +value;
        } else if (letter === 'T') {
            const [num, denom] = value.split('/');
            barSize = +num / (+denom || 1);
        } else if (letter[0] >= 'A' && letter[0] <= 'G') {
            const note = letter[0] + (letter[1] === '#' ? '#' : '') + (+letter[1] || +letter[2] || defaultOctave);
            const duration = value ? (+value > 4 ? (1 / +value) : (+value / 4)) : defaultNoteLength;

            parsed.push({
                note,
                duration
            });

            minNote = minNote ? (getLedgerDistance(minNote, note) < 0 ? note : minNote) : note;
            maxNote = maxNote ? (getLedgerDistance(maxNote, note) > 0 ? note : maxNote) : note;
        }
    });

    return {
        barSize,
        maxNote,
        minNote,
        notes: parsed,
    };
}

export default class PianoPerformance {

    static FRAME_RATE = 60;
    static FORGIVENESS = 0.5;

    constructor(parent, options = {}) {
        console.log('constructor', {
            options,
        });

        const { bpm, minNote, maxNote, sheetMusic } = {
            ...{
                // Defaults
            },
            ...options
        };

        this.bpm = bpm;
        this.music = parseSheetMusic(sheetMusic);

        this.activeNotes = new Set();
        document.addEventListener('pp-note-trigger', e => {
            this.activeNotes.add(e.detail.note);

            if (!this.pause) {
                const current = this._getCurrentNotes();
                if (current.length) {
                    console.log({
                        current,
                        active: [...this.activeNotes]
                    });
                }
                current.forEach(i => {
                    if (!this.scoredNotes.has(i)) {
                        if (this.activeNotes.has(this.music.notes[i].note)) {
                            this.scoredNotes.add(i);
                        }
                    }
                });
            }
        });
        document.addEventListener('pp-note-release', e => {
            this.activeNotes.delete(e.detail.note);
        });

        this.scoredNotes = new Set();
        this.pause = true;
        this.timeOffset = -4;
        
        const canvas = document.createElement('canvas');
        canvas.addEventListener('mouseup', e => {
            if (e.button === 0) {
                this.pause = !this.pause;
            }
        });
        parent.appendChild(canvas);
        this.canvas = canvas;

        const keyboard = new Keyboard(parent, {
            minNote: minNote || this.music.minNote,
            maxNote: maxNote || this.music.maxNote,
        });

        const resizeCanvas = () => {
            canvas.width = Math.max(600, Math.min(parent.offsetWidth, keyboard.container.offsetWidth));
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', resizeCanvas);

        setTimeout(() => {
            resizeCanvas();
            this._draw();
        }, 0);
    }

    _draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        const topBottomPad = 75;
        const leftPad = 80;
        const rightPad = 5;

        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        const staffX = leftPad;
        const staffY = topBottomPad;
        const staffWidth = w - leftPad - rightPad;
        const staffHeight = h - 2 * topBottomPad;

        const noteSpacing = 60;
        const activeOffset = 30;

        this.staffCtx = this._drawStaff(staffX, staffY, staffWidth, staffHeight);
        this._drawActiveNotes(activeOffset);

        let offset = activeOffset - this.timeOffset * noteSpacing;
        let beatCount = 0;
        this.music.notes.forEach(({note, duration}, i) => {
            const notePassed = this.timeOffset > beatCount * 4 + PianoPerformance.FORGIVENESS;
            const color = this.scoredNotes.has(i) ? 'green' : (notePassed ? 'red' : '#000000');

            this._drawNote(note, duration, offset, color);
            
            beatCount += duration;
            offset += noteSpacing * 4 * duration;

            if (beatCount % this.music.barSize === 0) {
                this._drawBar(offset - noteSpacing / 2);
            }
        });

        ctx.clearRect(0, 0, leftPad, h);

        this._drawStaff(0, staffY, leftPad, staffHeight);

        ctx.translate(25, 200);
        ctx.scale(0.01, -0.01);
        ctx.fill(trebbleClef);
        ctx.translate(-25, -200);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.font = '20px Arial';
        ctx.fillText(`Score ${this.scoredNotes.size} / ${this.music.notes.length}`, w - 130, 30);

        const songLength = this.music.notes.reduce((acc, x) => acc + x.duration, 0) * 4;
        if (!this.pause && this.timeOffset < songLength + 1) {
            this.timeOffset += this.bpm / 60 / PianoPerformance.FRAME_RATE;
        }
        const compTime = window.performance.now() - this.lastDraw;
        this.lastDraw = window.performance.now();
        setTimeout(this._draw.bind(this), 1000.0 / PianoPerformance.FRAME_RATE - compTime);
    }

    _drawStaff(x, y, width, height) {
        const lineScaler = 10.0;
        const lineWidth = Math.max(1, height / 4.0 / lineScaler);
        const spacing = height / 4.0;
        const color = '#000000';

        const ctx = this.canvas.getContext('2d');

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.fillStyle = color;

        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + spacing * i);
            ctx.lineTo(x + width, y + spacing * i);
            ctx.stroke();
        }

        return {
            canvas: this.canvas,
            x,
            y,
            width,
            height,
            spacing,
            lineWidth,
            color
        };
    }

    _drawNote(note, duration, offset, color, decorated = true) {
        const x = this.staffCtx.x + offset;
        const y = Math.floor(
            this.staffCtx.y + getLedgerDistance(note, 'F5') * this.staffCtx.spacing / 2
        );

        const upperLedgers = Math.floor(getLedgerDistance('F5', note) / 2);
        const lowerLedgers = Math.floor(getLedgerDistance(note, 'E4') / 2);

        const noteSize = this.staffCtx.spacing * 0.747;
        const noteStrokeWidth = 4;
        const noteStretch = 1.1;

        const ctx = this.canvas.getContext('2d');

        //#region Draw Ledgers
        ctx.strokeStyle = this.staffCtx.color;
        ctx.lineWidth = this.staffCtx.lineWidth;
        ctx.fillStyle = this.staffCtx.color;

        for (let i = 0; i < upperLedgers; i++) {
            const ledgerY = this.staffCtx.y - this.staffCtx.spacing * (i + 1);

            ctx.beginPath();
            ctx.moveTo(x - noteSize * 0.8, ledgerY);
            ctx.lineTo(x + noteSize * 0.8, ledgerY);
            ctx.stroke();
        }

        for (let i = 0; i < lowerLedgers; i++) {
            const ledgerY = this.staffCtx.y + this.staffCtx.height + this.staffCtx.spacing * (i + 1);

            ctx.beginPath();
            ctx.moveTo(x - noteSize * 0.8, ledgerY);
            ctx.lineTo(x + noteSize * 0.8, ledgerY);
            ctx.stroke();
        }
        //#endregion
        
        //#region Draw Note
        ctx.strokeStyle = color;
        ctx.lineWidth = noteStrokeWidth;
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.ellipse(x, y, Math.floor((noteSize - (decorated ? noteStrokeWidth : 0)) / 2 * noteStretch), Math.floor((noteSize - (decorated ? noteStrokeWidth : 0)) / 2), 0, 0, 2 * Math.PI);
        if (duration < 0.5) {
            ctx.fill();
        }
        if (decorated) {
            ctx.stroke();
        }
        //#endregion

        //#region Draw Sharp
        if (note[1] === '#') {
            ctx.lineWidth = this.staffCtx.lineWidth / 2;
            ctx.lineCap = 'square';

            ctx.beginPath();
            ctx.moveTo(x - noteSize * 1.1, y - noteSize * 1.05);
            ctx.lineTo(x - noteSize * 1.1, y + noteSize * 0.95);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x - noteSize * 1.4, y - noteSize * 0.95);
            ctx.lineTo(x - noteSize * 1.4, y + noteSize * 1.05);
            ctx.stroke();

            ctx.lineWidth = this.staffCtx.lineWidth;

            ctx.beginPath();
            ctx.moveTo(x - noteSize * 1.5, y - noteSize * 0.2);
            ctx.lineTo(x - noteSize * 1, y - noteSize * 0.4);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x - noteSize * 1.5, y + noteSize * 0.4);
            ctx.lineTo(x - noteSize * 1, y + noteSize * 0.2);
            ctx.stroke();
        }
        //#endregion

        if (decorated) {
            //#region Draw Tail
            if (duration < 1) {
                ctx.lineWidth = this.staffCtx.lineWidth;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(x + (noteSize / 2 - this.staffCtx.lineWidth / 2) * (getLedgerDistance('B4', note) > 0 ? -1 : 1), y);
                ctx.lineTo(x + (noteSize / 2 - this.staffCtx.lineWidth / 2) * (getLedgerDistance('B4', note) > 0 ? -1 : 1), y - 2 * this.staffCtx.spacing * (getLedgerDistance('B4', note) > 0 ? -1 : 1));
                ctx.stroke();
            }
            //#endregion

            //#region Draw Dot
            if (Math.abs(Math.log2(duration)) % 0.25 !== 0) {
                ctx.beginPath();
                ctx.ellipse(x + noteSize, y, noteSize / 8, noteSize / 8, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
            //#endregion
        }
    }

    _drawBar(offset) {
        const ctx = this.canvas.getContext('2d');

        ctx.strokeStyle = this.staffCtx.color;
        ctx.lineWidth = this.staffCtx.lineWidth;
        ctx.fillStyle = this.staffCtx.color;

        ctx.beginPath();
        ctx.moveTo(this.staffCtx.x + offset, this.staffCtx.y);
        ctx.lineTo(this.staffCtx.x + offset, this.staffCtx.y + this.staffCtx.height);
        ctx.stroke();
    }

    _drawActiveNotes(offset) {
        const overhangY = 40;
        const radius = 10;

        const x = this.staffCtx.x + offset;
        const minY = this.staffCtx.y - overhangY;
        const maxY = this.staffCtx.y + this.staffCtx.height + overhangY;

        const ctx = this.canvas.getContext('2d');
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';

        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.arcTo(x + radius, minY, x + radius, minY + radius, radius);
        ctx.arcTo(x + radius, maxY, x, maxY, radius);
        ctx.arcTo(x - radius, maxY, x - radius, maxY - radius, radius);
        ctx.arcTo(x - radius, minY, x, minY, radius);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        this.activeNotes.forEach(x => {
            this._drawNote(x, 0.25, offset, 'rgba(100, 100, 100, 0.5)', false);
        });
    }

    _getCurrentNotes() {
        const notes = [];

        let beatCount = 0;
        this.music.notes.forEach(({duration}, i) => {
            if (
                this.timeOffset >= beatCount - PianoPerformance.FORGIVENESS
                && this.timeOffset <= beatCount + PianoPerformance.FORGIVENESS
            ) {
                notes.push(i);
            }

            beatCount += duration * 4;
        });

        return notes;
    }
    
}
