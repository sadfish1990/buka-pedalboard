// MistressFlanger Node - Extreme Jet Edition
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class MistressFlangerNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // Flanger Core
        // Uses shorter delay for more dramatic metallic sound
        this._delay = context.createDelay(0.02); // Max 20ms
        this._feedbackGain = context.createGain();

        // Summing: Input + Feedback -> Delay
        // Remove saturation for cleaner "Jet" (avoid synth oscillation)
        this._sum = context.createGain();

        this._input.connect(this._sum);
        this._feedbackGain.connect(this._sum);
        this._sum.connect(this._delay);

        // Modulation
        this._lfo = context.createOscillator();
        this._lfo.type = 'triangle'; // Triangle gives linear sweep (Jet)
        this._lfoGain = context.createGain();

        this._lfo.connect(this._lfoGain);
        this._lfoGain.connect(this._delay.delayTime);
        this._lfo.start();

        // Output Mixing
        // For deep notches, Dry and Wet must be EQUAL volume.
        this._dryGain = context.createGain();
        this._wetGain = context.createGain();

        this._input.connect(this._dryGain);
        this._delay.connect(this._wetGain);

        // Loop tap
        this._delay.connect(this._feedbackGain);

        this._dryGain.connect(this._output);
        this._wetGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._rate = 0.5;
        this._range = 0.5;
        this._color = 0.5;
        this._matrixMode = false;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeSaturationCurve() {
        // Unused now
    }

    _updateDSP() {
        if (!this._isBypassed) {
            // Perfect 50/50 Mix for max cancellation
            this._dryGain.gain.value = 1.0;
            this._wetGain.gain.value = 1.0;
        } else {
            this._dryGain.gain.value = 0;
            this._wetGain.gain.value = 0;
        }

        // RATE
        // Classic ranges: 0.05Hz (20s cycle) to 5Hz
        const frequency = 0.05 + (this._rate * 4.95);
        this._lfo.frequency.setTargetAtTime(frequency, this._context.currentTime, 0.1);

        if (this._matrixMode) {
            // FILTER MATRIX
            // Fixed position. Range knob sets Manual Delay.
            this._lfoGain.gain.setTargetAtTime(0, this._context.currentTime, 0.1);

            // Manual tuning
            const minD = 0.0003;
            const maxD = 0.008;
            const manual = minD + (this._range * (maxD - minD));
            this._delay.delayTime.setTargetAtTime(manual, this._context.currentTime, 0.1);

        } else {
            // FLANGER MODE - JET TUNING
            // The "Whoosh" pass-by effect needs a wide sweep that touches low delays.
            // Center is higher, depth is wide.

            const center = 0.005; // 5ms
            // Max sweep: From 0.2ms to 9.8ms
            const depthMax = 0.0048;
            const modDepth = this._range * depthMax;

            this._delay.delayTime.setTargetAtTime(center, this._context.currentTime, 0.1);
            this._lfoGain.gain.setTargetAtTime(modDepth, this._context.currentTime, 0.1);
        }

        // COLOR (Feedback)
        // High feedback is key, but kept clean ( < 1.0 )
        // 0.95 is usually the sweet spot for ringing without howling.
        const fb = this._color * 0.96;
        this._feedbackGain.gain.setTargetAtTime(fb, this._context.currentTime, 0.1);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._dryGain.gain.value = 0;
            this._wetGain.gain.value = 0;
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
            case 'rate': this._rate = value; this._updateDSP(); break;
            case 'range': this._range = value; this._updateDSP(); break;
            case 'color': this._color = value; this._updateDSP(); break;
            case 'matrix': this._matrixMode = (value > 0.5); this._updateDSP(); break;
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
