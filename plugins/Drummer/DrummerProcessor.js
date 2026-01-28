// DrummerProcessor.js - Sample accurate sequencer V2 (Sections + Transport)
class DrummerProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._phase = 0;
        this._step = 0;
        this._samples = { kick: null, snare: null, hat: null };

        // Sections state
        // A, B, C patterns
        this._sections = {
            'A': {
                kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            },
            'B': { // Variation
                kick: [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
                hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1]
            },
            'C': { // Fills
                kick: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            }
        };

        this._currentSection = 'A';
        this._targetSection = 'A'; // For queued switching if we wanted, instant for now

        this._voices = [];
        this._bpm = 120;
        this._rate = 44100;
        this._playing = true; // Auto-play by default? User asked for Stop button. Default should be true or false? 
        // Let's default true so it makes sound on load, user can stop.

        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'sample') {
                this._samples[data.name] = data.buffer;
            } else if (type === 'pattern') {
                // data: { section, name, step, val }
                const sec = data.section || this._currentSection;
                if (this._sections[sec] && this._sections[sec][data.name]) {
                    this._sections[sec][data.name][data.step] = data.val;
                }
            } else if (type === 'bpm') {
                this._bpm = data;
            } else if (type === 'transport') {
                this._playing = data; // boolean
                if (!this._playing) {
                    this._step = 0;
                    this._phase = 0;
                    // Note: We don't kill voices (tails allowed)
                }
            } else if (type === 'section') {
                this._currentSection = data;
                // Notify main thread of pattern update?
                // The main thread likely initiated this, but we should push back the pattern state so GUI updates
                this.port.postMessage({ type: 'pattern_dump', section: data, pattern: this._sections[data] });
            } else if (type === 'set_all_patterns') {
                // Bulk load (Presets)
                // data: { kick: [], snare: [], hat: [] }
                // Applies to CURRENT section
                this._sections[this._currentSection] = data;
                // Request GUI refresh
                this.port.postMessage({ type: 'pattern_dump', section: this._currentSection, pattern: data });
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const frames = output[0].length;
        this._rate = sampleRate;

        if (!this._playing) {
            // Still process tails
            this._renderVoices(output, 0, frames);
            return true;
        }

        const stepSamples = (60 / this._bpm) * 0.25 * this._rate;

        for (let i = 0; i < frames; i++) {
            this._phase++;
            if (this._phase >= stepSamples) {
                this._phase = 0;
                this._step = (this._step + 1) % 16;
                this._triggerStep(this._step);

                if (i === 0) this.port.postMessage({ type: 'step', step: this._step });
            }
            // Per-sample mixing is expensive in loop, but accurate
            // Optimization: Process voices in block if no triggers happen?
            // For now, strict per-sample logic for consistency
        }

        // Optimize: Mix voices in a separate loop for the whole block?
        // Trigger logic splits the block. 
        // We know triggers happen at specific samples.
        // But simpler to just mix sample-by-sample or reuse mixed function?
        // Let's mix sample by sample correctly in the loop below to handle intra-frame triggers

        // Actually, the above loop only advanced clock.
        // Let's rewrite to render audio.

        // Clear buffer
        output[0].fill(0);
        if (output[1]) output[1].fill(0);

        let sampleIndex = 0;

        while (sampleIndex < frames) {
            // Find frames until next trigger
            const samplesUntilTrigger = Math.ceil(stepSamples - this._phase);
            const processCount = Math.min(frames - sampleIndex, samplesUntilTrigger);

            // Render existing voices for processCount
            this._renderVoices(output, sampleIndex, processCount);

            // Advance clock
            this._phase += processCount;
            sampleIndex += processCount;

            // Trigger if reached
            if (this._phase >= stepSamples) {
                this._phase = 0;
                this._step = (this._step + 1) % 16;
                this._triggerStep(this._step);

                // Notify Step (once per block maximum or queue them? Just last one usually fine for UI)
                this.port.postMessage({ type: 'step', step: this._step });
            }
        }

        return true;
    }

    _renderVoices(output, start, count) {
        const outL = output[0];
        const outR = output[1];

        for (let v = this._voices.length - 1; v >= 0; v--) {
            const voice = this._voices[v];
            const buffer = voice.buffer;

            for (let i = 0; i < count; i++) {
                if (voice.pos < buffer.length) {
                    const s = buffer[voice.pos++];
                    outL[start + i] += s;
                    if (outR) outR[start + i] += s;
                } else {
                    this._voices.splice(v, 1);
                    break; // Voice dead
                }
            }
        }
    }

    _triggerStep(step) {
        const pat = this._sections[this._currentSection];
        if (pat.kick[step]) this._play('kick');
        if (pat.snare[step]) this._play('snare');
        if (pat.hat[step]) this._play('hat');
    }

    _play(name) {
        const buffer = this._samples[name];
        if (buffer) {
            this._voices.push({ buffer: buffer, pos: 0 });
        }
    }
}

registerProcessor('drummer-processor', DrummerProcessor);
