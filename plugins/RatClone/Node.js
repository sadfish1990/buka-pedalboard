// RatClone Node - ProCo RAT Distortion
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class RatCloneNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // Pre-distortion filter (LM308 op-amp character)
        this._preFilter = context.createBiquadFilter();
        this._preFilter.type = 'lowpass';
        this._preFilter.frequency.value = 5000; // Rolls off highs before clipping
        this._preFilter.Q.value = 0.7;

        // Distortion gain
        this._distGain = context.createGain();
        this._distGain.gain.value = 1.0;

        // Hard clipper
        this._clipper = context.createWaveShaper();
        this._clipper.curve = this._makeHardClipCurve();
        this._clipper.oversample = '4x';

        // Post-distortion tone filter (the "Filter" knob)
        this._toneFilter = context.createBiquadFilter();
        this._toneFilter.type = 'lowpass';
        this._toneFilter.frequency.value = 2000;
        this._toneFilter.Q.value = 0.7;

        // Output volume
        this._volumeGain = context.createGain();
        this._volumeGain.gain.value = 1.0;

        // Routing: Input -> PreFilter -> DistGain -> Clipper -> ToneFilter -> Volume -> Output
        this._input.connect(this._preFilter);
        this._preFilter.connect(this._distGain);
        this._distGain.connect(this._clipper);
        this._clipper.connect(this._toneFilter);
        this._toneFilter.connect(this._volumeGain);
        this._volumeGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0; // Muted initially
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Wire CompositeAudioNode
        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeHardClipCurve() {
        // Hard symmetric clipping (RAT uses silicon diodes)
        const samples = 2048;
        const curve = new Float32Array(samples);
        const threshold = 0.7; // Clip threshold

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;

            // Hard clip
            if (x > threshold) {
                curve[i] = threshold;
            } else if (x < -threshold) {
                curve[i] = -threshold;
            } else {
                curve[i] = x;
            }
        }

        return curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            // Mute effect, enable bypass
            this._volumeGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            // Restore effect, mute bypass
            this._bypassGain.gain.value = 0;
            this._volumeGain.gain.value = this._savedVolume || 1.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'distortion':
                // Distortion: 1x to 100x gain
                this._distGain.gain.value = 1 + (value * 99);
                break;
            case 'filter':
                // Filter: 200Hz to 10kHz (RAT's aggressive sweep)
                const minFreq = Math.log(200);
                const maxFreq = Math.log(10000);
                const freq = Math.exp(minFreq + (value * (maxFreq - minFreq)));
                this._toneFilter.frequency.value = freq;
                break;
            case 'volume':
                // Volume: 0.1x to 2x
                const vol = 0.1 + (value * 1.9);
                this._volumeGain.gain.value = vol;
                this._savedVolume = vol; // Save for bypass
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._input.disconnect();
        this._output.disconnect();
    }
}
