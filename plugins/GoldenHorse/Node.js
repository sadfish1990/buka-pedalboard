// GoldenHorse Node - Klon Centaur Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class GoldenHorseNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Input split for clean blend
        this._input = context.createGain();
        this._dryGain = context.createGain();
        this._wetGain = context.createGain();

        // Pre-gain
        this._preGain = context.createGain();
        this._preGain.gain.value = 1.0;

        // Soft clipping via WaveShaper
        this._clipper = context.createWaveShaper();
        this._clipper.curve = this._makeAsymmetricCurve();
        this._clipper.oversample = '4x'; // Reduce aliasing

        // Tone control (treble boost)
        this._toneFilter = context.createBiquadFilter();
        this._toneFilter.type = 'highshelf';
        this._toneFilter.frequency.value = 1000;
        this._toneFilter.gain.value = 0; // Neutral

        // Output gain
        this._output = context.createGain();
        this._output.gain.value = 1.0;

        // Routing:
        // Input -> [Dry path] -> DryGain -----> Output
        //       -> [Wet path] -> PreGain -> Clipper -> Tone -> WetGain -> Output

        this._input.connect(this._dryGain);
        this._dryGain.connect(this._output);

        this._input.connect(this._preGain);
        this._preGain.connect(this._clipper);
        this._clipper.connect(this._toneFilter);
        this._toneFilter.connect(this._wetGain);
        this._wetGain.connect(this._output);

        // Default blend: 50/50
        this._updateBlend(0.5);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0; // Bypass path muted initially
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Start with effect active (not bypassed)
        this._bypassed = false;

        // Wire CompositeAudioNode to internal input
        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeAsymmetricCurve() {
        // Asymmetric soft clipping (germanium diode simulation)
        const samples = 2048;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1; // -1 to 1

            // Asymmetric: different curves for positive/negative
            if (x > 0) {
                // Positive: softer clipping (germanium forward)
                curve[i] = Math.tanh(x * 2) * 0.9;
            } else {
                // Negative: harder clipping
                curve[i] = Math.tanh(x * 3) * 0.7;
            }
        }

        return curve;
    }

    _updateBlend(gain) {
        // Gain 0 = all dry, 1 = all wet
        // As gain increases, wet increases and dry decreases
        const wetAmount = gain;
        const dryAmount = 1 - (gain * 0.7); // Dry doesn't go to zero, stays at 30%

        this._wetGain.gain.value = wetAmount;
        this._dryGain.gain.value = dryAmount;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._bypassed = bypassed;

        if (bypassed) {
            // Bypass: mute effect, enable direct path
            this._wetGain.gain.value = 0;
            this._dryGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            // Active: restore effect, mute bypass
            this._bypassGain.gain.value = 0;
            // Restore blend (will be set by gain param)
            this._updateBlend(this._preGain.gain.value / 11); // Reverse calc
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'gain':
                // Gain control affects pre-gain and blend
                this._preGain.gain.value = 1 + (value * 10); // 1x to 11x
                this._updateBlend(value);
                break;
            case 'tone':
                // Tone: 0 = flat, 1 = +12dB treble boost
                this._toneFilter.gain.value = value * 12;
                break;
            case 'output':
                // Output: Clean boost 0.1x to 2x
                this._output.gain.value = 0.1 + (value * 1.9);
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
