// PolyChrome Node - Analog Chorus/Flanger
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class PolyChromeNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Core DSP: BBD Delay Line ---

        // Feedback Loop
        this._feedbackGain = context.createGain();
        this._feedbackGain.gain.value = 0;

        // Delay Line
        this._delay = context.createDelay(1.0); // Max 1 sec

        // LFO
        this._lfo = context.createOscillator();
        this._lfo.type = 'triangle'; // Typical for Flangers
        this._lfoGain = context.createGain();

        // Tuning (Base Delay Time)
        // We modulate delayTime.
        // delayTime = Tune + (LFO * Width)

        // Wiring logic:
        // Input -> Delay -> Output
        // Delay -> Feedback -> Input
        // Input clean -> Output (Mix)

        // We need a Dry/Wet mix node or parallel paths
        this._dryGain = context.createGain();
        this._wetGain = context.createGain();

        // Input splits
        this._input.connect(this._dryGain);
        this._input.connect(this._delay);

        // Feedback loop
        this._delay.connect(this._feedbackGain);
        this._feedbackGain.connect(this._delay);
        // NOTE: Feedback directly to input usually creates feedback loop error in WebAudio if not handled carefully?
        // Standard way: Input -> Delay. Delay -> Feedback -> Delay input using a Gain node as summer.

        // Proper loop:
        this._summer = context.createGain();
        this._input.connect(this._summer);
        this._feedbackGain.connect(this._summer);
        this._summer.connect(this._delay);

        // Output Mix
        this._delay.connect(this._wetGain);

        this._dryGain.connect(this._output);
        this._wetGain.connect(this._output);

        // Modulation
        this._lfo.connect(this._lfoGain);
        this._lfoGain.connect(this._delay.delayTime);
        this._lfo.start();

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._width = 0.5;
        this._rate = 0.3;
        this._feedback = 0.5;
        this._delayTime = 0.5; // "Tune"
        this._mode = 0; // 0=Chorus, 1=Flange, 2=Matrix

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateDSP() {
        if (!this._isBypassed) {
            this._dryGain.gain.value = 1.0;
            this._wetGain.gain.value = 1.0; // 50/50 Mix
        } else {
            this._dryGain.gain.value = 0;
            this._wetGain.gain.value = 0;
        }

        // Rate (0.1Hz - 10Hz)
        const rate = 0.1 + (this._rate * 9.9);
        this._lfo.frequency.setTargetAtTime(rate, this._context.currentTime, 0.1);

        // Tune (Base Delay)
        // Flanger: 1ms - 10ms
        // Chorus: 10ms - 30ms
        // Double Track: 30ms - 100ms
        // We'll map the "Tune" knob 0-1 to 1ms - 50ms log scale

        const minTime = 0.001;
        const maxTime = 0.050; // 50ms
        const baseTime = minTime + (this._delayTime * (maxTime - minTime));

        // Width (Modulation Depth)
        // Must be less than baseTime to avoid negative delay
        // Max width = baseTime * 0.9
        const maxWidth = baseTime * 0.95;
        const width = this._width * maxWidth;

        // If Mode is Filter Matrix (2), stop LFO modulation (Width=0)
        // But user might want to manual sweep "Tune"
        if (this._mode === 2) {
            this._lfoGain.gain.setTargetAtTime(0, this._context.currentTime, 0.1);
        } else {
            this._lfoGain.gain.setTargetAtTime(width, this._context.currentTime, 0.1);
        }

        this._delay.delayTime.setTargetAtTime(baseTime, this._context.currentTime, 0.1);

        // Feedback
        // Flangers need high feedback. Chorus low.
        // We let the knob control it, but limit to < 1.0
        const fb = this._feedback * 0.95;
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
            case 'width': this._width = value; this._updateDSP(); break;
            case 'rate': this._rate = value; this._updateDSP(); break;
            case 'tune': this._delayTime = value; this._updateDSP(); break;
            case 'feedback': this._feedback = value; this._updateDSP(); break;
            case 'mode': this._mode = value; this._updateDSP(); break;
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
