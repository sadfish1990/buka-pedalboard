// CryBaby Node - Inductor Wah Emulation
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class CryBabyNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // --- NODES ---
        this._input = context.createGain();
        this._output = context.createGain(); // Final Exit

        // Wah Circuit
        this._inputGain = context.createGain();
        this._inputGain.gain.value = 1.2; // Slight boost to drive filter

        // The "Inductor" - Peaking filter behaves most like a classic wah
        // (Bandpass is too thin, Lowpass doesn't have the throat)
        this._filter = context.createBiquadFilter();
        this._filter.type = 'peaking';
        this._filter.Q.value = 4.0; // Vocal resonance
        this._filter.gain.value = 20; // 20dB boost at resonant peak

        // Output trim
        this._outputGain = context.createGain();
        this._outputGain.gain.value = 0.8;

        // Bypass Signal Path
        this._bypassNode = context.createGain();
        this._effectNode = context.createGain();

        // --- GRAPH ---
        // Input -> Split
        this._input.connect(this._inputGain);
        this._input.connect(this._bypassNode);

        // Effect Path: InputGain -> Filter -> OutGain -> EffectNode
        this._inputGain.connect(this._filter);
        this._filter.connect(this._outputGain);
        this._outputGain.connect(this._effectNode);

        // Join
        this._effectNode.connect(this._output);
        this._bypassNode.connect(this._output);

        // Init state: Effect ON
        this._bypassNode.gain.value = 0;
        this._effectNode.gain.value = 1;

        // Set initial sweep
        this._setSweep(0); // Heel down

        // Wiring
        AudioNode.prototype.connect.call(this, this._input);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        const val = parseFloat(value);

        if (name === 'pedal') {
            this._setSweep(val);
        }

        if (name === 'bypass') {
            // 0 = Active, 1 = Bypassed
            const isBypass = val > 0.5;
            this._bypassNode.gain.value = isBypass ? 1 : 0;
            this._effectNode.gain.value = isBypass ? 0 : 1;
        }
    }

    _setSweep(pos) {
        // pos 0..1
        // Range: 450Hz to 2200Hz (Typical Crybaby)
        // Sweep should be exponential for musical feel
        const minFn = Math.log(450);
        const maxFn = Math.log(2200);
        const targetFreq = Math.exp(minFn + (maxFn - minFn) * pos);

        // Smooth transition
        this._filter.frequency.setTargetAtTime(targetFreq, this._context.currentTime, 0.01);

        // Dynamic Q? Classic wahs typically have constant bandwidth in Hz, meaning varying Q
        // But constant Q 'peaking' sounds very close. 
        // Some models sharpen at the top. Let's add slight Q boost at top.
        // Q: 4 at bottom, 6 at top
        const targetQ = 4 + (pos * 2);
        this._filter.Q.setTargetAtTime(targetQ, this._context.currentTime, 0.01);
    }

    destroy() {
        super.destroy();
        this._input.disconnect();
        this._output.disconnect();
        this._filter.disconnect();
    }
}
