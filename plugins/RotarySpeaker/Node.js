// RotarySpeaker Node - Continuous Speed Edition
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class RotarySpeakerNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- AUDIO GRAPH SETUP ---

        // 1. Pre-Drive
        this._driveGain = context.createGain();
        this._shaper = context.createWaveShaper();

        // 2. Crossover
        this._crossFreq = 800;
        this._lp = context.createBiquadFilter();
        this._lp.type = 'lowpass';
        this._lp.frequency.value = this._crossFreq;

        this._hp = context.createBiquadFilter();
        this._hp.type = 'highpass';
        this._hp.frequency.value = this._crossFreq;

        // 3. Modulators
        this._hornDelay = context.createDelay();
        this._drumDelay = context.createDelay();
        this._hornDelay.delayTime.value = 0.002;
        this._drumDelay.delayTime.value = 0.004;

        this._hornLfo = context.createOscillator();
        this._drumLfo = context.createOscillator();

        this._hornDepth = context.createGain();
        this._drumDepth = context.createGain();
        this._hornDepth.gain.value = 0.001;
        this._drumDepth.gain.value = 0.0005;

        this._hornGain = context.createGain();
        this._drumGain = context.createGain();

        this._hornAmDepth = context.createGain();
        this._drumAmDepth = context.createGain();
        this._hornAmDepth.gain.value = 0.3;
        this._drumAmDepth.gain.value = 0.2;

        // Wiring
        this._input.connect(this._driveGain);
        this._driveGain.connect(this._shaper);
        this._shaper.connect(this._lp);
        this._shaper.connect(this._hp);

        this._lp.connect(this._drumDelay);
        this._drumDelay.connect(this._drumGain);

        this._hp.connect(this._hornDelay);
        this._hornDelay.connect(this._hornGain);

        this._drumGain.connect(this._output);
        this._hornGain.connect(this._output);

        this._hornLfo.connect(this._hornDepth);
        this._hornDepth.connect(this._hornDelay.delayTime);
        this._hornLfo.connect(this._hornAmDepth);
        this._hornAmDepth.connect(this._hornGain.gain);

        this._drumLfo.connect(this._drumDepth);
        this._drumDepth.connect(this._drumDelay.delayTime);
        this._drumLfo.connect(this._drumAmDepth);
        this._drumAmDepth.connect(this._drumGain.gain);

        this._hornLfo.start();
        this._drumLfo.start();

        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // --- SAFE INITIALIZATION ---
        this._isBypassed = false;
        this._speedVal = 0.3; // Continuous 0-1
        this._drive = 0.2;
        this._balance = 0.5;

        this._currentHornSpeed = 0.4;
        this._currentDrumSpeed = 0.4;
        this._targetHornSpeed = 0.4;
        this._targetDrumSpeed = 0.4;

        // Generate initial curve safely
        this._makeDistortionCurve(this._drive);

        this._setupPhysics();

        // Initial DSP update
        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeDistortionCurve(amount) {
        if (!Number.isFinite(amount)) amount = 0;
        const k = amount * 10;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (Math.PI + k) * x / 2 / (Math.PI + k * Math.abs(x));
        }
        this._shaper.curve = curve;
    }

    _setupPhysics() {
        const interval = 50;
        setInterval(() => {
            const kHorn = 0.05;
            const kDrum = 0.02;

            // Safety Check targets
            if (!Number.isFinite(this._targetHornSpeed)) this._targetHornSpeed = 0.4;
            if (!Number.isFinite(this._targetDrumSpeed)) this._targetDrumSpeed = 0.4;

            this._currentHornSpeed += (this._targetHornSpeed - this._currentHornSpeed) * kHorn;
            this._currentDrumSpeed += (this._targetDrumSpeed - this._currentDrumSpeed) * kDrum;

            if (Number.isFinite(this._currentHornSpeed) && this._currentHornSpeed > 0)
                this._hornLfo.frequency.setTargetAtTime(this._currentHornSpeed, this._context.currentTime, 0.1);

            if (Number.isFinite(this._currentDrumSpeed) && this._currentDrumSpeed > 0)
                this._drumLfo.frequency.setTargetAtTime(this._currentDrumSpeed, this._context.currentTime, 0.1);

        }, interval);
    }

    _updateDSP() {
        // Continuous Speed Logic (0-1 input)
        // 0 = 0.5Hz (Very slow)
        // 1 = 10Hz (Fast)

        const val = Math.max(0, Math.min(1, this._speedVal));
        const target = 0.5 + (val * 9.5);

        this._targetHornSpeed = target;
        this._targetDrumSpeed = target * 0.9;

        // Drive
        if (Number.isFinite(this._drive)) {
            this._makeDistortionCurve(this._drive);
        }

        // Balance
        let bal = this._balance;
        if (!Number.isFinite(bal)) bal = 0.5;
        if (bal < 0) bal = 0; if (bal > 1) bal = 1;

        if (!this._isBypassed) {
            if (this._drumGain && this._drumGain.gain)
                this._drumGain.gain.value = (1.0 - bal);

            if (this._hornGain && this._hornGain.gain)
                this._hornGain.gain.value = bal;
        }
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._hornGain.disconnect();
            this._drumGain.disconnect();
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._hornGain.connect(this._output);
            this._drumGain.connect(this._output);
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        if (!Number.isFinite(value)) return;

        this._wamNode?.setParamValue(name, value);
        switch (name) {
            case 'speed':
                this._speedVal = value; // Store as float 0-1
                this._updateDSP();
                break;
            case 'drive':
                this._drive = value;
                this._updateDSP();
                break;
            case 'balance':
                this._balance = value;
                this._updateDSP();
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        if (this._hornLfo) this._hornLfo.stop();
        if (this._drumLfo) this._drumLfo.stop();
        this._input.disconnect();
        this._output.disconnect();
    }
}
