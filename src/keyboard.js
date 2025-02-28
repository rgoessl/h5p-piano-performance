import * as Tone from 'tone';
import { getSemiTonalDistance, nextNote, noteHasSharp } from './note-math';

export default class Keyboard {
    static whiteKeys = 'asdfghjkl;\'';
    static blackKeys = 'wertyuiop[';

    constructor(parent, options = {}) {
        const { minNote, maxNote, hotkeyOffset } = {
            ...{
                minNote: 'C4',
                maxNote: 'E5',
                hotkeyOffset: 0,
            },
            ...options,
        };

        this.isLeftMousePressed = false;
        document.addEventListener('mousedown', e => {
            if (e.button === 0) {
                this.isLeftMousePressed = true;
            }
        });
        document.addEventListener('mouseup', e => {
            if (e.button === 0) {
                this.isLeftMousePressed = false;
            }
        });

        this.synth = new Tone.PolySynth().toDestination();

        const container = document.createElement('ul');
        this.container = container;
        parent.appendChild(container);

        container.setAttribute('id', 'keyboard');

        document.addEventListener('keyup', e => {
            if (e.key === '`') {
                container.classList.toggle('hide-hotkeys');
            }
        });

        const exclNote = nextNote(maxNote);
        for (let note = minNote, i = hotkeyOffset * -1; getSemiTonalDistance(note, exclNote) > 0; note = nextNote(note), i++) {
            const item = document.createElement('li');
            item.classList.add('key-pair');

            const white = document.createElement('div');
            white.classList.add('key');
            white.setAttribute('data-note', note);
            white.addEventListener('mousedown', this._keyboardMouseDown.bind(this, note));
            white.addEventListener('mouseup', this._keyboardMouseUp.bind(this, note));
            white.addEventListener('mouseenter', this._keyboardMouseEnter.bind(this, note));
            white.addEventListener('mouseleave', this._keyboardMouseLeave.bind(this, note));
            if (i >= 0 && i < Keyboard.whiteKeys.length) {
                white.textContent = Keyboard.whiteKeys[i].toUpperCase();
                this._bindHotkey(Keyboard.whiteKeys[i], note);
            }
            item.appendChild(white);

            if (noteHasSharp(note)) {
                note = nextNote(note);
                if (getSemiTonalDistance(nextNote(note), exclNote) > 0) {
                    const black = document.createElement('div');
                    black.classList.add('black-key');
                    black.setAttribute('data-note', note);
                    black.addEventListener('mousedown', this._keyboardMouseDown.bind(this, note));
                    black.addEventListener('mouseup', this._keyboardMouseUp.bind(this, note));
                    black.addEventListener('mouseenter', this._keyboardMouseEnter.bind(this, note));
                    black.addEventListener('mouseleave', this._keyboardMouseLeave.bind(this, note));
                    if (i >= 0 && i < Keyboard.blackKeys.length) {
                        black.textContent = Keyboard.blackKeys[i].toUpperCase();
                        this._bindHotkey(Keyboard.blackKeys[i], note);
                    }
                    item.appendChild(black);
                }
            }

            container.appendChild(item);
        }
    }

    _getKey(note) {
        return this.container.querySelector(`[data-note="${note}"]`);
    }

    _bindHotkey(key, note) {
        document.addEventListener('keydown', e => {
            if (e.key === key) {
                this._triggerNote(note);
            }
        });
        document.addEventListener('keyup', e => {
            if (e.key === key) {
                this._releaseNote(note);
            }
        });
    }

    _keyboardMouseDown(note) {
        setTimeout(() => { // Wait for document level event handler
            this._keyboardMouseEnter(note);
        }, 0);
    }

    _keyboardMouseUp(note) {
        setTimeout(() => { // Wait for document level event handler
            if (!this.isLeftMousePressed) {
                this._releaseNote(note);
            }
        }, 0);
    }

    _keyboardMouseEnter(note) {
        if (this.isLeftMousePressed) {
            this._triggerNote(note);
        }
    }

    _keyboardMouseLeave(note) {
        this._releaseNote(note);
    }

    _triggerNote(note) {
        const el = this._getKey(note);
        if (!el.classList.contains('pressed')) {
            el.classList.add('pressed');
            this.synth.triggerAttack(note, Tone.now());
            el.dispatchEvent(new CustomEvent('pp-note-trigger', { bubbles: true, detail: { note } }));
        }
    }

    _releaseNote(note) {
        const el = this._getKey(note);
        if (el.classList.contains('pressed')) {
            el.classList.remove('pressed');
            this.synth.triggerRelease([ note ], Tone.now());
            el.dispatchEvent(new CustomEvent('pp-note-release', { bubbles: true, detail: { note } }));
        }
    }
}