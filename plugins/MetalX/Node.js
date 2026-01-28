// MetalX Node - High Gain Distortion Engine
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class MetalXNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // --- NODES ---
        this._input = context.createGain();
        this._output = context.createGain();

        // 1. Noise Gate (Simple expander)
        this._gate = context.createGain();
        this._analyser = context.createAnalyser();
        this._analyser.fftSize = 256;

        // 2. Pre-Shape
        this._preLowCut = context.createBiquadFilter();
        this._preLowCut.type = 'highpass';
        this._preLowCut.frequency.value = 120;

        this._preMidBoost = context.createBiquadFilter();
        this._preMidBoost.type = 'peaking';
        this._preMidBoost.frequency.value = 800;
        this._preMidBoost.Q.value = 1.0;
        this._preMidBoost.gain.value = 6;

        // 3. Distortion Stage
        this._driveGain = context.createGain();
        this._shaper = context.createWaveShaper();
        this._shaper.curve = this._makeDistortionCurve(400);
        this._shaper.oversample = '4x';

        // 4. Post-EQ (Tone Stack)
        this._low = context.createBiquadFilter();
        this._low.type = 'lowshelf';
        this._low.frequency.value = 100;

        this._high = context.createBiquadFilter();
        this._high.type = 'highshelf';
        this._high.frequency.value = 3000;

        this._mid = context.createBiquadFilter();
        this._mid.type = 'peaking';
        this._mid.Q.value = 1.5;

        this._scoop = context.createBiquadFilter();
        this._scoop.type = 'notch';
        this._scoop.frequency.value = 900;
        this._scoop.Q.value = 2.0;
        this._scoop.gain.value = 0;

        this._level = context.createGain();

        // --- GRAPH ---
        this._input.connect(this._analyser);
        this._input.connect(this._gate);
        this._gate.connect(this._preLowCut);
        this._preLowCut.connect(this._preMidBoost);
        this._preMidBoost.connect(this._driveGain);
        this._driveGain.connect(this._shaper);
        this._shaper.connect(this._low);
        this._low.connect(this._high);
        this._high.connect(this._mid);
        this._mid.connect(this._scoop);
        this._scoop.connect(this._level);
        this._level.connect(this._output);

        // Gate Loop
        this._gateThreshold = 0.01;
        this._gateActive = false;
        this._loopId = null;

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Initialize saved level
        this._savedLevel = 0.5;

        // Wiring
        AudioNode.prototype.connect.call(this, this._input);

        this._startGate();
    }

    _startGate() {
        const buffer = new Float32Array(this._analyser.fftSize);
        const checkGate = () => {
            this._analyser.getFloatTimeDomainData(buffer);
            let rms = 0;
            for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
            rms = Math.sqrt(rms / buffer.length);

            if (this._gateActive) {
                const target = (rms > this._gateThreshold) ? 1.0 : 0.0;
                this._gate.gain.setTargetAtTime(target, this._context.currentTime, 0.01);
            } else {
                this._gate.gain.setTargetAtTime(1.0, this._context.currentTime, 0.01);
            }
            this._loopId = requestAnimationFrame(checkGate);
        };
        checkGate();
    }

    getGateReduction() {
        return this._gate.gain.value;
    }

    _makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const deg = Math.PI / 180;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            this._level.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._level.gain.value = this._savedLevel || 0.5;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        const val = parseFloat(value);

        switch (name) {
            case 'gain':
                this._driveGain.gain.value = 1 + (val * 10);
                break;
            case 'vol':
                const lvl = val / 10;
                this._level.gain.value = lvl;
                this._savedLevel = lvl;
                break;
            case 'low':
                this._low.gain.value = (val - 5) * 3;
                break;
            case 'high':
                this._high.gain.value = (val - 5) * 3;
                break;
            case 'mid':
                this._mid.gain.value = (val - 5) * 3;
                break;
            case 'freq':
                const minF = Math.log(200);
                const maxF = Math.log(5000);
                const freq = Math.exp(minF + (val / 10) * (maxF - minF));
                this._mid.frequency.value = freq;
                break;
            case 'gate':
                if (val < 0.5) {
                    this._gateActive = false;
                } else {
                    this._gateActive = true;
                    this._gateThreshold = 0.001 * Math.pow(2, val);
                }
                break;
            case 'scoop':
                this._scoop.type = 'peaking';
                this._scoop.gain.value = (val > 0.5) ? -20 : 0;
                break;
        }
    }

    destroy() {
        super.destroy();
        cancelAnimationFrame(this._loopId);
        this._input.disconnect();
        this._output.disconnect();
    }
}
