// VintageTrem Node - Amplitude Modulation
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class VintageTremNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // Tremolo VCA
        this._tremGain = context.createGain();
        this._tremGain.gain.value = 1.0; // Base gain, will be modulated

        // LFO
        this._lfo = context.createOscillator();
        this._lfo.type = 'sine';
        this._lfo.frequency.value = 5.0; // Hz
        this._lfo.start();

        // LFO Depth Control
        // LFO (-1 to 1) -> DepthGain -> TremGain.gain
        // But gain cannot go negative.
        // Modulation: 1.0 + (LFO * Depth) usually.
        // Or cleaner: VCA gain = 1 - ( (LFO+1)/2 * Depth )

        // We'll use a GainNode to scale LFO output
        this._lfoGain = context.createGain();
        this._lfoGain.gain.value = 0.5; // Depth

        // Connect LFO -> LFO Gain -> Trem Gain input? 
        // No, TremGain value.
        // AudioParam control.
        this._lfo.connect(this._lfoGain);
        this._lfoGain.connect(this._tremGain.gain);

        // Routing
        this._input.connect(this._tremGain);
        this._tremGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._speed = 0.5;
        this._depth = 0.5;
        this._shape = 0; // 0=Sine, 1=Tri, 2=Square

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateDSP() {
        // Speed Mapping (0.5Hz to 15Hz)
        const speed = 0.5 + (this._speed * 14.5);
        this._lfo.frequency.setTargetAtTime(speed, this._context.currentTime, 0.05);

        // Depth Mapping
        // LFO is -1 to 1.
        // We want tremolo gain to oscillate between 1.0 and (1.0 - Depth).
        // If Depth=1, gain oscillates 1 to 0 (Silence).
        // But multiplying gain directly by -1..1 LFO adds/subtracts from Base param value (1.0).
        // So Gain = 1.0 + (LFO * Scale).
        // If LFO is -1..1, we want peak at 1.0?
        // Wait, standard AM is centered.
        // Let's assume gain base is 1 - (depth/2)? No.

        // Easier approach:
        // Gain Node base Value = 1.0
        // Modulation = LFO * 0.5 * Depth.
        // Result: 1.0 +/- 0.5 = 0.5 to 1.5. (Boosts?)
        // Tremolo usually CUTS volume.

        // Correct approach:
        // Gain = 1.0 - (UnipolarLFO * Depth)
        // We check shape.

        // For standard oscillator (-1 to 1):
        // We scale it to 0.5 modulation.
        this._lfoGain.gain.setTargetAtTime(this._depth * 0.5, this._context.currentTime, 0.05);

        // Ensure gain node base is slightly lowered to avoid clipping if adding harmonic trem?
        // Simple trem: TremGain base = 1.0 - (this._depth * 0.5);
        // Then add LFO modulation?

        // Let's stick to simple:
        // TremGain.gain.value = 1.0 is set initially.
        // LFO adds +/- X.
        // If X=0.5, Gain goes 0.5 to 1.5.
        // We want 0.0 to 1.0 at max depth.
        // So we need LFO to be -0.5 to +0.5, and Base Gain to be 0.5.

        // Set Base Gain
        const base = 1.0 - (this._depth * 0.5);
        this._tremGain.gain.setTargetAtTime(base, this._context.currentTime, 0.05);

        // Set Shape
        switch (parseInt(this._shape)) {
            case 0: this._lfo.type = 'sine'; break;
            case 1: this._lfo.type = 'triangle'; break;
            case 2: this._lfo.type = 'square'; break;
        }
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._tremGain.disconnect();
            this._bypassGain.gain.value = 1;
        } else {
            this._tremGain.connect(this._output);
            this._bypassGain.gain.value = 0;
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        switch (name) {
            case 'speed': this._speed = value; this._updateDSP(); break;
            case 'depth': this._depth = value; this._updateDSP(); break;
            case 'shape': this._shape = value * 2; this._updateDSP(); break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._lfo.stop();
        this._input.disconnect();
        this._output.disconnect();
    }
}
