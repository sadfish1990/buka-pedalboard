// FuzzCircle Node - Fuzz Face Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class FuzzCircleNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // Input impedance simulation (Fuzz Face is very sensitive to input impedance)
        this._inputGain = context.createGain();
        this._inputGain.gain.value = 1.0;

        // Fuzz gain
        this._fuzzGain = context.createGain();
        this._fuzzGain.gain.value = 1.0;

        // Transistor saturation (extreme soft clipping)
        this._clipper = context.createWaveShaper();
        this._clipper.curve = this._makeGermaniumCurve(); // Default to Germanium
        this._clipper.oversample = '4x';

        // Volume
        this._volumeGain = context.createGain();
        this._volumeGain.gain.value = 1.0;

        // Routing: Input -> InputGain -> FuzzGain -> Clipper -> Volume -> Output
        this._input.connect(this._inputGain);
        this._inputGain.connect(this._fuzzGain);
        this._fuzzGain.connect(this._clipper);
        this._clipper.connect(this._volumeGain);
        this._volumeGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Wire CompositeAudioNode
        AudioNode.prototype.connect.call(this, this._input);

        this._isGermanium = true; // Track transistor type
    }

    _makeGermaniumCurve() {
        // Germanium: Broken, splatty, velcro fuzz
        const samples = 2048;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;

            // Asymmetric hard clipping with "broken" character
            if (x > 0) {
                // Positive: Hard clip early (torn speaker)
                if (x > 0.3) {
                    curve[i] = 0.3 + Math.tanh((x - 0.3) * 2) * 0.2;
                } else {
                    curve[i] = x;
                }
            } else {
                // Negative: Even harder clip (asymmetric)
                if (x < -0.2) {
                    curve[i] = -0.2 + Math.tanh((x + 0.2) * 1.5) * 0.15;
                } else {
                    curve[i] = x;
                }
            }
        }

        return curve;
    }

    _makeSiliconCurve() {
        // Silicon: Brutal, gated, velcro fuzz (more aggressive)
        const samples = 2048;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;

            // Very hard asymmetric clipping
            if (x > 0) {
                // Positive: Brutal hard clip
                if (x > 0.25) {
                    curve[i] = 0.25 + Math.tanh((x - 0.25) * 1) * 0.15;
                } else {
                    curve[i] = x * 1.2; // Slight boost before clip
                }
            } else {
                // Negative: Super hard clip
                if (x < -0.15) {
                    curve[i] = -0.15 + Math.tanh((x + 0.15) * 0.8) * 0.1;
                } else {
                    curve[i] = x * 1.2;
                }
            }
        }

        return curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            this._volumeGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            // Restore saved volume instead of default
            this._volumeGain.gain.value = this._savedVolume || 1.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'fuzz':
                // Fuzz: 5x to 200x gain (EXTREME range for real fuzz)
                this._fuzzGain.gain.value = 5 + (value * 195);
                break;
            case 'volume':
                // Volume: 0.1x to 2x
                const vol = 0.1 + (value * 1.9);
                this._volumeGain.gain.value = vol;
                this._savedVolume = vol; // Save for bypass restore
                break;
            case 'transistor':
                // 0 = Germanium, 1 = Silicon
                const isSilicon = value > 0.5;
                if (isSilicon !== !this._isGermanium) {
                    this._isGermanium = !isSilicon;
                    this._clipper.curve = this._isGermanium ?
                        this._makeGermaniumCurve() :
                        this._makeSiliconCurve();
                }
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
