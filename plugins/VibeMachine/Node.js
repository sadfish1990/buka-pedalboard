// VibeMachine Node - Pure Vibrato (Anti-Pop Refactor)
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class VibeMachineNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // 4-Stage All-Pass Filter Chain
        this._filters = [];
        for (let i = 0; i < 4; i++) {
            const f = context.createBiquadFilter();
            f.type = 'allpass';
            f.Q.value = 1.0;
            this._filters.push(f);
        }

        // Connect Chain
        this._input.connect(this._filters[0]);
        for (let i = 0; i < 3; i++) {
            this._filters[i].connect(this._filters[i + 1]);
        }

        // Wet Path Only (Vibrato)
        this._wetGain = context.createGain();
        this._filters[3].connect(this._wetGain);
        this._wetGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // LFO
        this._lfo = context.createOscillator();
        this._lfo.type = 'sine';
        this._lfoGain = context.createGain();
        this._lfo.connect(this._lfoGain);

        for (let f of this._filters) {
            this._lfoGain.connect(f.frequency);
        }

        this._lfo.start();

        // State
        this._isBypassed = false;
        this._intensity = 0.5;
        this._speed = 0.5;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateDSP() {
        if (!this._isBypassed) {
            // Pure Vibrato
            this._wetGain.gain.value = 1.0;
        } else {
            this._wetGain.gain.value = 0.0;
        }

        // Speed
        const speed = 0.5 + (this._speed * 9.5);
        this._lfo.frequency.setTargetAtTime(speed, this._context.currentTime, 0.05);

        // Fix Pop: Clamp Frequency
        // Center: 600Hz
        // Safe Range: ~200Hz to ~1000Hz
        // Max Deviation: 400Hz

        const safeDepth = this._intensity * 350; // Max 350Hz deviation (250Hz - 950Hz)
        this._lfoGain.gain.setTargetAtTime(safeDepth, this._context.currentTime, 0.1);

        for (let i = 0; i < this._filters.length; i++) {
            const f = this._filters[i];
            // Stagger centers slightly
            const base = 600 + (i * 50);
            f.frequency.setTargetAtTime(base, this._context.currentTime, 0.1);
        }
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._wetGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        switch (name) {
            case 'speed': this._speed = value; this._updateDSP(); break;
            case 'intensity': this._intensity = value; this._updateDSP(); break;
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
