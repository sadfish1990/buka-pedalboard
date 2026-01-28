// MemoryBrigade Node - Analog Delay Simulation
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class MemoryBrigadeNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // 1. Input Level & Overload
        // DMM has a distinctive preamp grit
        this._preAmp = context.createWaveShaper();
        this._makeSafeDistortion(0.0); // Clean start

        this._levelGain = context.createGain(); // Input Volume

        // 2. Delay Line
        this._delay = context.createDelay(1.0); // Max 1s (DMM usually 550ms)

        // 3. Feedback Loop
        this._feedbackGain = context.createGain();
        // Tone shaping in feedback (Low Pass for analog degradation)
        this._toneFilter = context.createBiquadFilter();
        this._toneFilter.type = 'lowpass';
        this._toneFilter.frequency.value = 2500; // Dark repeats
        this._toneFilter.Q.value = 0.5;

        // 4. Modulation (Chorus/Vibrato on repeats)
        this._lfo = context.createOscillator();
        this._lfo.type = 'triangle';
        this._lfoGain = context.createGain();

        // Wiring
        // Input -> Level -> PreAmp
        this._input.connect(this._levelGain);
        this._levelGain.connect(this._preAmp);

        // PreAmp splits: Dry and Delay Input
        this._dryGain = context.createGain();
        this._wetGain = context.createGain(); // Blend control nodes

        this._preAmp.connect(this._dryGain);

        // Delay Path
        // We need a summer for Feedback + Input
        this._delayInput = context.createGain();
        this._preAmp.connect(this._delayInput);

        this._delayInput.connect(this._delay);
        this._delay.connect(this._toneFilter);

        // Feedback path
        this._toneFilter.connect(this._feedbackGain);
        this._feedbackGain.connect(this._delayInput);

        // Wet Output
        this._toneFilter.connect(this._wetGain);

        // Modulation
        this._lfo.connect(this._lfoGain);
        this._lfoGain.connect(this._delay.delayTime);
        this._lfo.start();

        // Output Mix
        this._dryGain.connect(this._output);
        this._wetGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._delayTime = 0.3; // 300ms
        this._feedback = 0.3;
        this._blend = 0.5;
        this._depth = 0.0;
        this._level = 0.8; // 80% gain default
        this._modType = 0; // 0=Chorus, 1=Vibrato

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeSafeDistortion(amount) {
        if (!Number.isFinite(amount)) amount = 0;
        const k = amount * 5;
        const n = 256;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            const x = i * 2 / n - 1;
            // Soft clipping
            if (x < -0.5) curve[i] = -0.5 + (Number.isFinite(x) ? Math.tanh(x + 0.5) * 0.5 : 0);
            else if (x > 0.5) curve[i] = 0.5 + (Number.isFinite(x) ? Math.tanh(x - 0.5) * 0.5 : 0);
            else curve[i] = x;
        }
        this._preAmp.curve = curve;
    }

    _updateDSP() {
        if (!this._isBypassed) {
            const blend = Math.max(0, Math.min(1, this._blend));
            this._dryGain.gain.value = 1.0 - blend;
            this._wetGain.gain.value = blend;
        } else {
            this._dryGain.gain.value = 0;
            this._wetGain.gain.value = 0;
        }

        // Level (Input Drive)
        // DMM overloads pleasantly. 
        // Knob 0-1 maps to Gain 0.5 to 2.0
        const lvl = 0.5 + (this._level * 1.5);
        this._levelGain.gain.value = lvl;

        // Delay Time (Short 30ms to Long 550ms)
        const time = 0.03 + (this._delayTime * 0.52);
        this._delay.delayTime.setTargetAtTime(time, this._context.currentTime, 0.1);

        // Feedback
        // Danger zone > 0.9. Limit to 1.1 for self oscillation fun, but careful.
        // Let's cap at 0.95 for safety? DMM self-oscillates wildly.
        // Let's allow 1.05 max.
        const fb = this._feedback * 1.05;
        this._feedbackGain.gain.setTargetAtTime(fb, this._context.currentTime, 0.1);

        // Modulation
        // Chorus = Slow rate, Triangle?
        // Vibrato = Faster rate, Triangle?
        // Actually DMM has a switch for Chorus/Vibrato which changes RATE/DEPTH relationship.

        let rate = 0;
        let depthScale = 0;

        if (this._modType === 0) {
            // Chorus
            rate = 0.6;
            depthScale = 0.005;
        } else if (this._modType === 2) {
            // Vibrato (Map from 2 now)
            rate = 3.5;
            depthScale = 0.002;
        } else {
            // OFF (Mode 1)
            rate = 0;
            depthScale = 0;
        }

        this._lfo.frequency.setTargetAtTime(rate, this._context.currentTime, 0.1);

        // Depth Knob controls the amplitude of LFO
        const mod = this._depth * depthScale;
        this._lfoGain.gain.setTargetAtTime(mod, this._context.currentTime, 0.1);
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
            case 'level': this._level = value; this._updateDSP(); break;
            case 'blend': this._blend = value; this._updateDSP(); break;
            case 'feedback': this._feedback = value; this._updateDSP(); break;
            case 'delay': this._delayTime = value; this._updateDSP(); break;
            case 'depth': this._depth = value; this._updateDSP(); break;
            case 'type': this._modType = value; this._updateDSP(); break;
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
