// BassSynth Node - Analog Microsynth Emulator
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class BassSynthNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- COMPONENTS ---

        // 1. Voice Generation
        // We reuse the robust PitchShifter (Dual Delay) logic for Sub and Octave
        // Square wave = Fuzz/Clipping

        // Sub Octave (-1 Octave)
        this._subVoice = this._createPitchVoice(0.5); // Ratio 0.5 = -1 Oct

        // Octave Up (+1 Octave)
        this._octVoice = this._createPitchVoice(2.0); // Ratio 2.0 = +1 Oct

        // Square Wave (Distortion)
        this._squareShaper = context.createWaveShaper();
        this._makeSquareCurve();
        this._squareGain = context.createGain(); // Input gain to drive square
        this._squareGain.gain.value = 100.0; // Hard clipping

        // Wiring Voices
        this._input.connect(this._subVoice.input);
        this._input.connect(this._octVoice.input);
        this._input.connect(this._squareGain);
        this._squareGain.connect(this._squareShaper);

        // 2. Mixer
        this._mixSub = context.createGain();
        this._mixGtr = context.createGain();
        this._mixOct = context.createGain();
        this._mixSqr = context.createGain();

        this._subVoice.output.connect(this._mixSub);
        this._input.connect(this._mixGtr);
        this._octVoice.output.connect(this._mixOct);
        this._squareShaper.connect(this._mixSqr);

        // Summing point before filter
        this._preFilterMix = context.createGain();
        this._mixSub.connect(this._preFilterMix);
        this._mixGtr.connect(this._preFilterMix);
        this._mixOct.connect(this._preFilterMix);
        this._mixSqr.connect(this._preFilterMix);

        // 3. Filter Section (The "Synth" part)
        this._filter = context.createBiquadFilter();
        this._filter.type = 'lowpass';
        this._filter.Q.value = 5.0; // Resonant default

        // Envelope Follower for Sweep
        // Input -> Rectifier -> Smoothing -> Filter Freq
        // Doing this in pure WebAudio nodes:
        // Input -> Abs -> LPF -> Gain (Depth) -> Filter.detune/frequency?

        // Simplified Envelope:
        // We will do a "One Shot" sweep if Trigger is detected?
        // MicroSynth usually has "Start Freq" and "Stop Freq" and "Rate".
        // It sweeps continuously or triggered?
        // The original has a "Rate" slider for sweep speed. It's triggered by attack.
        // Implementing a robust envelope follower in graph is tricky without Worklets.
        // Let's use a simplified constant LFO sweep or just a static envelope follower filter (AutoWah style).

        // Let's implement an "Auto-Wah" style follower + Fixed Sweep LFO?
        // Users often set it to sweep DOWN or UP on every note.
        // Without note detection, we can only follow envelope.

        // Filter Architecture:
        // Signal -> Filter -> Output
        this._preFilterMix.connect(this._filter);
        this._filter.connect(this._output);

        // Envelope Follower
        this._envFollower = this._createEnvelopeFollower();
        this._envFollower.input.connect(this._input); // Follow dynamics of raw input

        // Env Signal (-1 to +1?) -> Filter Freq
        // We'll modulate the filter frequency based on envelope + sliders.
        this._sweepGain = context.createGain();
        this._envFollower.output.connect(this._sweepGain);
        this._sweepGain.connect(this._filter.frequency);

        // Bypass Logic
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        // Voices
        this._vSub = 0.0;
        this._vGtr = 1.0; // Dry
        this._vOct = 0.0;
        this._vSqr = 0.0;
        // Filter
        this._res = 0.5;
        this._startFreq = 0.2; // 0-1
        this._stopFreq = 0.8;  // 0-1
        this._rate = 0.5;      // Envelope Speed/Sensitivity

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeSquareCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            // Hard clipping for square wave
            const x = i * 2 / n - 1;
            curve[i] = x > 0 ? 0.8 : -0.8; // Square
        }
        this._squareShaper.curve = curve;
    }

    _createPitchVoice(ratio) {
        // Reusing the robust PitchShifter logic (Dual Delay Crossfade)
        // Simplified for fixed ratio
        const input = this._context.createGain();
        const output = this._context.createGain();

        const delayA = this._context.createDelay(0.2);
        const delayB = this._context.createDelay(0.2);
        const gainA = this._context.createGain();
        const gainB = this._context.createGain();

        input.connect(delayA); input.connect(delayB);
        delayA.connect(gainA); delayB.connect(gainB);
        gainA.connect(output); gainB.connect(output);

        // LFO
        const src = this._context.createBufferSource();
        src.loop = true;

        // Buffer setup (Triangle Windows)
        // We can create a new buffer for each voice to be safe (PolyOctave lesson)
        const sr = this._context.sampleRate;
        const len = sr;
        const buf = this._context.createBuffer(4, len, sr);
        const s1 = buf.getChannelData(0);
        const w1 = buf.getChannelData(1);
        const s2 = buf.getChannelData(2);
        const w2 = buf.getChannelData(3);

        for (let i = 0; i < len; i++) {
            const p1 = i / len;
            const p2 = (p1 + 0.5) % 1.0;
            s1[i] = p1; s2[i] = p2;
            w1[i] = 1 - Math.abs(2 * p1 - 1);
            w2[i] = 1 - Math.abs(2 * p2 - 1);
        }
        src.buffer = buf;

        const split = this._context.createChannelSplitter(4);
        src.connect(split);

        const modA = this._context.createGain();
        const modB = this._context.createGain();

        split.connect(modA, 0); modA.connect(delayA.delayTime);
        split.connect(gainA.gain, 1);
        split.connect(modB, 2); modB.connect(delayB.delayTime);
        split.connect(gainB.gain, 3);

        // DSP Math
        const window = 0.05; // 50ms standard
        const slope = 1.0 - ratio;
        const freq = slope / window;
        const absFreq = Math.abs(freq);
        const dir = freq >= 0 ? 1 : -1;

        if (Number.isFinite(absFreq)) src.playbackRate.value = absFreq;
        modA.gain.value = window * dir;
        modB.gain.value = window * dir;

        src.start();

        return { input, output, src };
    }

    _createEnvelopeFollower() {
        const input = this._context.createGain();
        const output = this._context.createGain();

        // Rectify?
        // Raw audio -> Gain (Sensitivity) -> Biquad (Lowpass ~10Hz) -> Output (Envelope signal)
        // This creates a DC signal representing amplitude.

        // 1. Rectification using WaveShaper (Abs)
        const shaper = this._context.createWaveShaper();
        const curve = new Float32Array(1024);
        for (let i = 0; i < 1024; i++) {
            curve[i] = Math.abs(i * 2 / 1024 - 1);
        }
        shaper.curve = curve;

        // 2. Smoothing Filter
        const smoother = this._context.createBiquadFilter();
        smoother.type = 'lowpass';
        smoother.frequency.value = 20; // Faster tracking (was 10Hz) for "Pew" attack

        input.connect(shaper);
        shaper.connect(smoother);
        smoother.connect(output);

        return { input, output, smoother };
    }

    _updateDSP() {
        if (!this._isBypassed) {
            this._mixSub.gain.value = this._vSub;
            this._mixGtr.gain.value = this._vGtr;
            this._mixOct.gain.value = this._vOct;
            this._mixSqr.gain.value = this._vSqr * 0.2; // Square is loud
        } else {
            this._mixSub.gain.value = 0;
            this._mixGtr.gain.value = 0;
            this._mixOct.gain.value = 0;
            this._mixSqr.gain.value = 0;
        }

        // Filter Logic
        // Rate controls Envelope Decay/Smoothing?
        // Or Rate controls direction?
        // Let's use Rate as "Sensitivity" or "Sweep Depth".

        // Start Freq: Base Cutoff
        // Stop Freq: Target max cutoff
        // Envelope moves filter from Start to Stop.

        // Map 0-1 to Hertz
        const minHz = 80;
        const maxHz = 3000;

        const startHz = minHz + (this._startFreq * (maxHz - minHz));
        // const stopHz = minHz + (this._stopFreq * (maxHz - minHz));

        // Set Base Frequency
        this._filter.frequency.setValueAtTime(startHz, this._context.currentTime);
        this._filter.Q.value = 1.0 + (this._res * 15.0); // 1 to 16 Resonance

        // Envelope Depth
        // Envelope output is approx 0..1 (amplitude)
        // We want to add (Stop - Start) * Envelope
        // Actually, let ranges be relative.
        // Rate slider scales the envelope signal magnitude.

        // Max sweep range in Hz
        const sweepRange = (this._stopFreq - this._startFreq) * 3000;

        // Apply to envelope gain
        // this._rate acts as sensitivity/amount
        const depth = sweepRange * this._rate * 2.0; // factor
        this._sweepGain.gain.setTargetAtTime(depth, this._context.currentTime, 0.1);

        // Adjust follower speed with Rate?
        // Maybe Fixed 10Hz is good for bass.
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._preFilterMix.disconnect(); // mute processed
            this._bypassGain.gain.value = 1;
        } else {
            this._preFilterMix.connect(this._filter);
            this._bypassGain.gain.value = 0;
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        if (!Number.isFinite(value)) return;
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'sub': this._vSub = value; break;
            case 'guitar': this._vGtr = value; break;
            case 'octave': this._vOct = value; break;
            case 'square': this._vSqr = value; break;

            case 'res': this._res = value; break;
            case 'start': this._startFreq = value; break;
            case 'stop': this._stopFreq = value; break;
            case 'rate': this._rate = value; break;
        }
        this._updateDSP();
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._subVoice.src.stop();
        this._octVoice.src.stop();
        this._input.disconnect();
        this._output.disconnect();
    }
}
