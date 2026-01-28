// FullDrive Node - OCD Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class FullDriveNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Input/Output
        this._input = context.createGain();
        this._output = context.createGain();

        // 1. Input Filtering / Pre-gain shaping
        // OCD has an op-amp stage that shapes tone before clipping
        this._preFilter = context.createBiquadFilter();
        this._preFilter.type = 'highpass';
        this._preFilter.frequency.value = 100; // Tighten bass

        // 2. Drive Gain
        this._driveGain = context.createGain();

        // 3. Clipping Stage (MOSFET Emulation)
        this._shaper = context.createWaveShaper();
        this._shaper.oversample = '4x';

        // 4. Tone Control (Passive LPF style)
        this._toneFilter = context.createBiquadFilter();
        this._toneFilter.type = 'lowpass';

        // 5. HP/LP Gain Compensation & Output Level
        this._postGain = context.createGain();
        this._levelGain = context.createGain();

        // Routing
        this._input.connect(this._preFilter);
        this._preFilter.connect(this._driveGain);
        this._driveGain.connect(this._shaper);
        this._shaper.connect(this._toneFilter);
        this._toneFilter.connect(this._postGain);
        this._postGain.connect(this._levelGain);
        this._levelGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._peakMode = 1; // 0=LP, 1=HP
        this._drive = 0.5;
        this._tone = 0.5;
        this._level = 0.5;

        this._updateDSP();
        this._updateCurve();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateDSP() {
        // Drive (0 to 100x gain)
        // HP Mode has more gain
        const gainMult = this._peakMode === 1 ? 150 : 80;
        this._driveGain.gain.value = 1 + (this._drive * gainMult);

        // Tone (LPF)
        // Range 500Hz (dark) to 10kHz (bright)
        // Logarithmic feel
        const minF = 500;
        const maxF = 10000;
        const f = minF * Math.pow(maxF / minF, this._tone);
        this._toneFilter.frequency.value = f;

        // HP/LP Mode Character
        if (this._peakMode === 1) { // HP (High Peak)
            // Mid boost, more volume
            this._preFilter.Q.value = 1.0; // slight resonance peak at input
            this._postGain.gain.value = 1.2;
        } else { // LP (Low Peak)
            // Flatter, transparent
            this._preFilter.Q.value = 0.5; // flat
            this._postGain.gain.value = 0.8;
        }

        if (!this._isBypassed) {
            this._levelGain.gain.value = this._level * 2.0;
        } else {
            this._levelGain.gain.value = 0;
        }
    }

    _updateCurve() {
        // MOSFET Asymmetrical Clipping
        // Positive side clips harder/different than negative
        const k = this._drive * 100; // Steepness
        const n = 44100;
        const curve = new Float32Array(n);

        for (let i = 0; i < n; i++) {
            const x = (i * 2 / n) - 1;

            // Asymmetry:
            // if x > 0: Hard clip at 0.8
            // if x < 0: Soft clip at -0.6

            if (x > 0) {
                curve[i] = Math.tanh(x * 5) * 0.8;
            } else {
                curve[i] = Math.tanh(x * 4) * 0.9; // Slightly different curve
            }
        }
        this._shaper.curve = curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._levelGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._updateDSP(); // Restore correct levels
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        switch (name) {
            case 'drive':
                this._drive = value;
                this._updateDSP();
                // We don't update curve constantly for perf, assuming tanh scales with input gain
                break;
            case 'tone':
                this._tone = value;
                this._updateDSP();
                break;
            case 'level':
                this._level = value;
                this._updateDSP();
                break;
            case 'mode':
                // 0=LP, 1=HP
                this._peakMode = value > 0.5 ? 1 : 0;
                this._updateDSP();
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
