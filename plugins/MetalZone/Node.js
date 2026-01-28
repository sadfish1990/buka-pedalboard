// MetalZone Node - Boss MT-2 Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class MetalZoneNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // --- Pre-Distortion Shaping ---
        // MT-2 has a mid-hump before clipping to tighten the sound
        this._preShape = context.createBiquadFilter();
        this._preShape.type = 'peaking';
        this._preShape.frequency.value = 700;
        this._preShape.Q.value = 1.0;
        this._preShape.gain.value = 10; // Boost mids into clipper

        this._preLowCut = context.createBiquadFilter();
        this._preLowCut.type = 'highpass';
        this._preLowCut.frequency.value = 80; // Tighten bass

        // --- Distortion Stage ---
        this._distGain = context.createGain();
        this._distGain.gain.value = 50; // Default high gain

        this._clipper = context.createWaveShaper();
        this._clipper.curve = this._makeDistortionCurve(400);
        this._clipper.oversample = '4x';

        // --- Post-Distortion EQ (The Magic) ---
        // High Shelf
        this._highShelf = context.createBiquadFilter();
        this._highShelf.type = 'highshelf';
        this._highShelf.frequency.value = 3000;
        this._highShelf.gain.value = 0; // +/- 15dB

        // Low Shelf
        this._lowShelf = context.createBiquadFilter();
        this._lowShelf.type = 'lowshelf';
        this._lowShelf.frequency.value = 100;
        this._lowShelf.gain.value = 0; // +/- 15dB

        // Parametric Mid (Freq + Gain)
        this._midParam = context.createBiquadFilter();
        this._midParam.type = 'peaking';
        this._midParam.frequency.value = 1000; // 200Hz - 5kHz
        this._midParam.Q.value = 1.5;
        this._midParam.gain.value = 0; // +/- 15dB

        // Output Level
        this._levelGain = context.createGain();
        this._levelGain.gain.value = 1.0;

        // Routing
        this._input.connect(this._preLowCut);
        this._preLowCut.connect(this._preShape);
        this._preShape.connect(this._distGain);
        this._distGain.connect(this._clipper);
        this._clipper.connect(this._highShelf);
        this._highShelf.connect(this._lowShelf);
        this._lowShelf.connect(this._midParam);
        this._midParam.connect(this._levelGain);
        this._levelGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Initialize saved level
        this._savedLevel = 1.0;

        // Wire
        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeDistortionCurve(amount) {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            // Hard clipping with slight softness at edges
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            this._levelGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._levelGain.gain.value = this._savedLevel || 1.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'dist':
                // Dist: 1x to 200x
                this._distGain.gain.value = 1 + (value * 199);
                break;
            case 'level':
                // Level: 0x to 2x
                const lvl = value * 2;
                this._levelGain.gain.value = lvl;
                this._savedLevel = lvl;
                break;
            case 'high':
                // High: +/- 15dB
                this._highShelf.gain.value = (value - 0.5) * 30;
                break;
            case 'low':
                // Low: +/- 15dB
                this._lowShelf.gain.value = (value - 0.5) * 30;
                break;
            case 'midFreq':
                // Mid Freq: 200Hz to 5kHz (Logarithmic)
                const minF = Math.log(200);
                const maxF = Math.log(5000);
                const freq = Math.exp(minF + (value * (maxF - minF)));
                this._midParam.frequency.value = freq;
                break;
            case 'midGain':
                // Mid Gain: +/- 15dB
                this._midParam.gain.value = (value - 0.5) * 30;
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
