// TubeWarmth Node - Valve Preamp Simulator
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class TubeWarmthNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // 1. Input Gain (Drive the tube)
        this._driveGain = context.createGain();

        // 2. Tube Emulation Stage (Asymmetrical WaveShaper)
        this._shaper = context.createWaveShaper();
        this._shaper.oversample = '4x';

        // 3. Output Stage (Tone shaping + Bias offset handling)
        // Tubes add DC offset, we need to block it.
        this._dcBlocker = context.createBiquadFilter();
        this._dcBlocker.type = 'highpass';
        this._dcBlocker.frequency.value = 20;

        // 4. Output Level
        this._levelGain = context.createGain();

        // Routing
        this._input.connect(this._driveGain);
        this._driveGain.connect(this._shaper);
        this._shaper.connect(this._dcBlocker);
        this._dcBlocker.connect(this._levelGain);
        this._levelGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._drive = 0.5;
        this._bias = 0.0; // 0 = Center (Class A/B), 1 = Cold (Class B/C, fizzy)
        this._level = 0.5;
        this._type = 0; // 0-1 range for selector

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateDSP() {
        // Drive: 1x to 50x
        const gain = 1 + (this._drive * 49);
        this._driveGain.gain.value = gain;

        // Output compensation (approximate)
        if (!this._isBypassed) {
            this._levelGain.gain.value = (this._level * 2.0) / Math.sqrt(gain);
        } else {
            this._levelGain.gain.value = 0;
        }

        this._updateCurve();
    }

    _updateCurve() {
        const n = 44100;
        const curve = new Float32Array(n);

        // Bias shifts the transfer function center
        const biasOffset = this._bias * 0.5;

        // Tube Profiles logic
        let k = 20;
        let asym = 0.5;

        // 0.00-0.25: 12AX7 (High Gain Triode)
        // 0.25-0.50: 12AT7 (Low Gain Triode)
        // 0.50-0.75: EL84  (Glassy Pentode)
        // 0.75-1.00: 6L6   (Warm Power)

        if (this._type < 0.25) {
            k = 80; asym = 0.6; // 12AX7
        } else if (this._type < 0.5) {
            k = 30; asym = 0.4; // 12AT7
        } else if (this._type < 0.75) {
            k = 60; asym = 0.2; // EL84
        } else {
            k = 40; asym = 0.3; // 6L6
        }

        for (let i = 0; i < n; i++) {
            let x = (i * 2 / n) - 1;
            x += biasOffset;

            // Asymmetric Soft Clipping
            if (x < -0.5) {
                // Negative (Grid)
                const limit = 0.5 + (0.4 * (1 - asym));
                curve[i] = -limit + Math.tanh((x + limit) * k) * (limit + 0.1);
            } else {
                // Positive (Plate)
                curve[i] = Math.tanh(x * k * 0.8);
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
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        switch (name) {
            case 'gain':
                this._drive = value;
                this._updateDSP();
                break;
            case 'bias':
                this._bias = value;
                this._updateCurve();
                break;
            case 'level':
                this._level = value;
                this._updateDSP();
                break;
            case 'type':
                this._type = value;
                this._updateCurve();
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
