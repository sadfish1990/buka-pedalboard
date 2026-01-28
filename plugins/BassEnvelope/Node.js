// BassEnvelope Node - Twin Filter Funk Machine
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class BassEnvelopeNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // 1. Distortion Circuit (Optional Fuzz)
        this._distGain = context.createGain();
        this._distShaper = context.createWaveShaper();
        this._makeDistCurve();

        // 2. Twin Filters (Parallel)
        // Filter 1: Lower Band
        this._filter1 = context.createBiquadFilter();
        this._filter1.type = 'bandpass';
        this._filter1.Q.value = 2.0; // Vocal quality

        // Filter 2: Upper Band
        this._filter2 = context.createBiquadFilter();
        this._filter2.type = 'bandpass';
        this._filter2.Q.value = 2.0;

        // Envelope Follower
        this._envFollower = this._createEnvelopeFollower();

        // Wiring
        // Input -> Dist (if on) -> Filters
        // Input -> Env Follower

        this._input.connect(this._envFollower.input);

        this._dryPath = context.createGain(); // Path to filters without distortion
        this._distPath = context.createGain(); // Path through distortion

        this._input.connect(this._dryPath);
        this._input.connect(this._distGain);
        this._distGain.connect(this._distShaper);
        this._distShaper.connect(this._distPath);

        // Mix Point before filters
        this._filtersInput = context.createGain();
        this._dryPath.connect(this._filtersInput);
        this._distPath.connect(this._filtersInput);

        this._filtersInput.connect(this._filter1);
        this._filtersInput.connect(this._filter2);

        this._filter1.connect(this._output);
        this._filter2.connect(this._output);

        // Modulation
        // Env -> Frequency 1 & 2
        this._modGain1 = context.createGain();
        this._modGain2 = context.createGain();

        this._envFollower.output.connect(this._modGain1);
        this._envFollower.output.connect(this._modGain2);

        this._modGain1.connect(this._filter1.frequency);
        this._modGain2.connect(this._filter2.frequency);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._sens = 0.5;
        this._attack = 0.1;
        this._decay = 0.5;
        this._isDist = false;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeDistCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = i * 2 / n - 1;
            curve[i] = Math.tanh(x * 5.0); // Simple saturation
        }
        this._distShaper.curve = curve;
    }

    _createEnvelopeFollower() {
        const input = this._context.createGain();
        const output = this._context.createGain();

        // Rectify
        const shaper = this._context.createWaveShaper();
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; ++i) curve[i] = Math.abs(i * 2 / 512 - 1);
        shaper.curve = curve;

        // Smooth
        const filter = this._context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 10;

        input.connect(shaper);
        shaper.connect(filter);
        filter.connect(output);

        return { input, output, filter };
    }

    _updateDSP() {
        if (!this._isBypassed) {
            // Dist Switch
            if (this._isDist) {
                this._dryPath.gain.value = 0;
                this._distPath.gain.value = 2.0; // Boost fuzz level
                this._distGain.gain.value = 5.0; // Drive
            } else {
                this._dryPath.gain.value = 1.0;
                this._distPath.gain.value = 0;
            }
            this._filter1.connect(this._output);
            this._filter2.connect(this._output);
        } else {
            this._dryPath.gain.value = 0;
            this._distPath.gain.value = 0;
            this._filter1.disconnect();
            this._filter2.disconnect();
        }

        // Filter Tuning (Typical "Bassballs")
        // F1: ~200Hz base
        // F2: ~400Hz base (Moving harmonically)
        const base1 = 200;
        const base2 = 400;

        this._filter1.frequency.setTargetAtTime(base1, this._context.currentTime, 0.1);
        this._filter2.frequency.setTargetAtTime(base2, this._context.currentTime, 0.1);

        // Sensitivity -> Modulation Depth
        // Max sweep: +2000Hz?
        const range = 2000;
        const depth = this._sens * range * 10; // Gain boost for envelope

        this._modGain1.gain.setTargetAtTime(depth, this._context.currentTime, 0.1);
        this._modGain2.gain.setTargetAtTime(depth, this._context.currentTime, 0.1);

        // Attack/Decay -> Smoothing Filter Q/Freq?
        // Simpler: Just adjust the LPF frequency of the envelope follower?
        // Attack = Rise time. Decay = Fall time.
        // Standard WebAudio Biquad doesn't separate rise/fall.
        // We simulate "Response" using the LPF frequency.
        // High Freq = Fast Response. Low Freq = Slow.
        // Map Decay knob to frequency.

        // Decay 0 (Fast) -> 50Hz
        // Decay 1 (Slow) -> 2Hz
        const speed = 50 - (this._decay * 48);
        this._envFollower.filter.frequency.setTargetAtTime(speed, this._context.currentTime, 0.1);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._filter1.disconnect();
            this._filter2.disconnect();
            this._bypassGain.gain.value = 1;
        } else {
            // Reconnect done in updateDSP logic essentially or just leave them connected to output?
            // The logic above disconnects them.
            this._bypassGain.gain.value = 0;
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        if (!Number.isFinite(value)) return;
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'sens': this._sens = value; break;
            case 'decay': this._decay = value; break;
            case 'dist': this._isDist = (value > 0.5); break;
        }
        this._updateDSP();
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._input.disconnect();
        this._output.disconnect();
    }
}
