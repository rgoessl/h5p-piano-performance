import './styles.css';
import PianoPerformance from './piano-performance';

H5P = H5P || {};
H5P.PianoPerformance = class {
  constructor(options, id) {
    console.log('constructor', {
      options,
      id,
    });

    this.options = {
      ...options
    };
    this.id = id;
  };

  attach($container) {
    console.log('attach', {
      options: this.options,
    });
    new PianoPerformance($container[0], {
      bpm: this.options.tempo,
      minNote: this.options.keyboardAuto ? undefined : this.options.noteMin,
      maxNote: this.options.keyboardAuto ? undefined : this.options.noteMax,
      sheetMusic: this.options.music,
    });
  }
};