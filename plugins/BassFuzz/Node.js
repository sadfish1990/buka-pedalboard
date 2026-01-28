// BassFuzz Node - Green Russian Emulator (Fixed Init Order)
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class BassFuzzNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> [Clean Path] & [Fuzz Path] -> Mix -> Output
        // Fuzz Path: PreGain -> Clipper -> Tone Stack -> PostGain

        // 1. Clean Path (Blend)
        this._cleanGain = context.createGain();
        this._fuzzGain = context.createGain();

        // 2. Fuzz Circuit
        // Input Drive
        this._sustainGain = context.createGain();

        // Clipping Stages (Cascaded for creamy sustain)
        // CRITICAL: Initialize BOTH waveshapers BEFORE generating curves

        // Stage 1: Soft Clip
        this._clip1 = context.createWaveShaper();

        // Stage 2: Hard Clip (Rectification/Fuzz)
        this._clip2 = context.createWaveShaper();

        // NOW generate curves (safe because both exist)
        this._makeFuzzCurve(0.5);

        // Coupling filter between stages (blocks DC, shapes tone)
        this._interFilter = context.createBiquadFilter();
        this._interFilter.type = 'highpass';
        this._interFilter.frequency.value = 80; // Keep mud out

        // Tone Stack (Muff Scoop)
        // Standard Muff tone stack is a specific LPF/HPF blend.
        // We simulate this with 2 parallel filters + crossfade
        this._toneLow = context.createBiquadFilter();
        this._toneLow.type = 'lowpass';
        this._toneLow.frequency.value = 400; // Muff Low side

        this._toneHigh = context.createBiquadFilter();
        this._toneHigh.type = 'highpass';
        this._toneHigh.frequency.value = 1200; // Muff High side

        this._tLowGain = context.createGain();
        this._tHighGain = context.createGain();

        // Output Level of Fuzz
        this._fuzzLevel = context.createGain();

        // Wiring
        this._input.connect(this._cleanGain);
        this._input.connect(this._sustainGain);

        // Fuzz Chain
        this._sustainGain.connect(this._clip1);
        this._clip1.connect(this._interFilter);
        this._interFilter.connect(this._clip2);

        // Tone Stage Split
        this._clip2.connect(this._toneLow);
        this._clip2.connect(this._toneHigh);

        this._toneLow.connect(this._tLowGain);
        this._toneHigh.connect(this._tHighGain);

        // Low Pass cap to tame harshness (Green Russian is dark)
        this._cabSim = context.createBiquadFilter();
        this._cabSim.type = 'lowpass';
        this._cabSim.frequency.value = 3000;

        // Re-route: tLow/tHigh -> cabSim -> fuzzLevel
        this._tLowGain.connect(this._cabSim);
        this._tHighGain.connect(this._cabSim);
        this._cabSim.connect(this._fuzzLevel);

        this._fuzzLevel.connect(this._fuzzGain);

        // Final Sum
        this._cleanGain.connect(this._output);
        this._fuzzGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._vol = 0.5;
        this._tone = 0.5;
        this._sustain = 0.5;
        this._blend = 0.5;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeFuzzCurve(amount) {
        // Hard symmetrical clipping
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            const x = i * 2 / n - 1;
            // Sigmoid for fuzz
            curve[i] = Math.tanh(x * 5.0);
        }
        if (this._clip1) this._clip1.curve = curve;
        if (this._clip2) this._clip2.curve = curve;
    }

    _updateDSP() {
        if (!this._isBypassed) {
            this._cleanGain.gain.value = (1.0 - this._blend);
            this._fuzzGain.gain.value = this._blend;
        } else {
            this._cleanGain.gain.value = 0;
            this._fuzzGain.gain.value = 0;
        }

        // Sustain (Input Gain)
        // Range 1 to 100
        const drive = 1.0 + (this._sustain * 99.0);
        this._sustainGain.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        // Tone
        // Crossfade Low vs High
        // 0 = Low Max, High Min
        // 1 = High Max, Low Min
        const t = this._tone;
        this._tLowGain.gain.setTargetAtTime(1.0 - t, this._context.currentTime, 0.1);
        this._tHighGain.gain.setTargetAtTime(t, this._context.currentTime, 0.1);

        // Volume
        this._fuzzLevel.gain.setTargetAtTime(this._vol * 2.0, this._context.currentTime, 0.1);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._cleanGain.gain.value = 0;
            this._fuzzGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        if (!Number.isFinite(value)) return;
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'vol': this._vol = value; break;
            case 'tone': this._tone = value; break;
            case 'sustain': this._sustain = value; break;
            case 'blend': this._blend = value; break;
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
