// PolyOctave Node - Delay-Based Pitch Shifter (Clean)
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

class PitchShifterLFO {
    constructor(context, delayNode, rate) {
        this.context = context;
        this.delayNode = delayNode;

        // Triangle LFO 0 to 1
        this.osc = context.createOscillator();
        this.osc.type = 'sawtooth'; // Sawtooth is linear ramp
        this.osc.frequency.value = rate;

        this.gain = context.createGain();
        // Delay modulation depth needs to be carefully tuned
        // Ideally delay range is window size.
        // We'll modulate delay time.
    }
}

// We'll implement the logic directly in the processor for precision crossfading
// Delay-based pitch shifting:
// Write to circular buffer. Read from 2 taps.
// Taps move at speed = (1 - pitchRatio)
// Crossfade between taps to hide the jump.

export default class OctaveGenNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // Params
        this._vol = { dry: 1, sub2: 0, sub1: 0, up1: 0, up2: 0 };

        // Processor
        this._setupPitchProcessor();

        this._input.connect(this._processor);
        this._processor.connect(this._output);

        this._isBypassed = false;
        AudioNode.prototype.connect.call(this, this._input);
    }

    _setupPitchProcessor() {
        const bufferSize = 4096; // Large buffer for pitch quality
        this._processor = this._context.createScriptProcessor(bufferSize, 1, 1);

        // Delay Buffer (1 second max)
        const maxDelay = this._context.sampleRate;
        const delayBuffer = new Float32Array(maxDelay);
        let writePointer = 0;

        // Voice State (for -2, -1, +1, +2)
        // Rate = frequency ratio. 
        // +1 Oct = 2.0 speed (read 2x faster) -> relative speed 1.0
        // -1 Oct = 0.5 speed (read 0.5x faster) -> relative speed -0.5

        // To pitch shift by ratio R, read head moves at Is * R.
        // Relative to write head (Is), delta is (R - 1).

        const voices = [
            { ratio: 0.25, vol: 'sub2', readPos: 0 }, // -2 Oct
            { ratio: 0.5, vol: 'sub1', readPos: 0 }, // -1 Oct
            { ratio: 2.0, vol: 'up1', readPos: 0 }, // +1 Oct
            { ratio: 4.0, vol: 'up2', readPos: 0 }  // +2 Oct
        ];

        const windowSize = 4096; // Crossfade window
        const halfWindow = windowSize / 2;

        this._processor.onaudioprocess = (e) => {
            if (this._isBypassed) return;

            const input = e.inputBuffer.getChannelData(0);
            const output = e.outputBuffer.getChannelData(0);

            for (let i = 0; i < input.length; i++) {
                const inSample = input[i];

                // Write to circular buffer
                delayBuffer[writePointer] = inSample;

                // Process Voices
                let outSample = inSample * this._vol.dry;

                for (let v = 0; v < voices.length; v++) {
                    const voice = voices[v];
                    const gain = this._vol[voice.vol];

                    if (gain < 0.01) {
                        // Silent voice, keep moving pointer roughly to stay in sync? 
                        // Actually better to just move it to keep phase coherence when volume up
                        // Or just skip calculation but update pointer
                    }

                    // Logic:
                    // Read Pointer moves at Speed = ratio
                    // Write Pointer moves at Speed = 1
                    // Delta = ratio - 1
                    // BUT circular buffer...

                    // We calculate Delay Time.
                    // Delay decreases when Ratio > 1 (faster)
                    // Delay increases when Ratio < 1 (slower)

                    // Standard pitch shift implementation:
                    // phasor goes 0..1
                    // pos1 = phasor * window
                    // pos2 = (phasor + 0.5) * window
                    // mix

                    if (!voice.phasor) voice.phasor = 0;

                    // Phasor step:
                    // How fast to move through the window?
                    // F_grain = proportional to pitch diff
                    // Ideally we want constant grain size time-wise (~50ms)
                    const grainFreq = 20; // Herz needed? 
                    // Let's stick to relative pointer movement:

                    // Speed difference
                    const speed = (voice.ratio - 1.0);
                    voice.readPos += speed;

                    // Wrap readPos within window relative to writePointer
                    // Actually, simpler approach:

                    // Use a Phasor (0-1) to scan through a delay window
                    // When phasor wraps, we crossfade.
                    // Rate of phasor = (Ratio - 1) / WindowSize ?

                    // Let's refine:
                    // We read from (WritePtr - Delay).
                    // Delay is modulated by a Triangle Wave (Phasor).

                    // Pitch Shift = Doppler Effect of Delay changing.
                    // Delay(t) = D0 + (1-R) * t
                    // We need a Sawtooth delay modulation.

                    // Rate:
                    // For R=2 (+1oct), we need to consume 1 extra sample per sample.
                    // Delay must decrease by 1 sample per sample.

                    voice.phasor += (1.0 - voice.ratio);

                    // Wrap phasor inside Window
                    while (voice.phasor >= windowSize) voice.phasor -= windowSize;
                    while (voice.phasor < 0) voice.phasor += windowSize;

                    // We need TWO taps to crossfade (to hide the wrap jump)
                    // Tap 1: at phasor
                    // Tap 2: at phasor + halfWindow (180 deg out of phase)

                    let offset1 = voice.phasor;
                    let offset2 = voice.phasor + halfWindow;
                    if (offset2 >= windowSize) offset2 -= windowSize;

                    // Read sample 1
                    let ptr1 = writePointer - Math.floor(offset1);
                    if (ptr1 < 0) ptr1 += maxDelay;
                    const samp1 = delayBuffer[ptr1];

                    // Read sample 2
                    let ptr2 = writePointer - Math.floor(offset2);
                    if (ptr2 < 0) ptr2 += maxDelay;
                    const samp2 = delayBuffer[ptr2];

                    // Triangular Envelope (0 at edges, 1 at center)
                    // Fade 1: 1 at halfWindow, 0 at 0/Window
                    // Normalized pos 0..1
                    let norm1 = offset1 / windowSize;
                    // Triangle shape: 0 -> 1 -> 0
                    let gain1 = 1 - Math.abs(2 * norm1 - 1);

                    let norm2 = offset2 / windowSize;
                    let gain2 = 1 - Math.abs(2 * norm2 - 1);

                    // Equal Power Crossfade attempt roughly
                    // Simple linear is ok for this

                    if (gain > 0.01) {
                        outSample += (samp1 * gain1 + samp2 * gain2) * gain;
                    }
                }

                output[i] = outSample;

                writePointer++;
                if (writePointer >= maxDelay) writePointer = 0;
            }
        };
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._processor.disconnect();
            this._input.connect(this._output);
        } else {
            this._input.disconnect(this._output);
            this._processor.connect(this._output);
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        if (this._vol.hasOwnProperty(name)) {
            this._vol[name] = value;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._processor.disconnect();
        this._input.disconnect();
        this._output.disconnect();
    }
}
