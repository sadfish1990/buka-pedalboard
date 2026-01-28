// Brit800 Node - JCM800 Emulator
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class Brit800Node extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> Preamp Gain -> Cold Clipper -> Tone Stack -> Presence -> Cab Sim -> Output

        // 1. Preamp Gain (Crunch)
        this._preampGain = context.createGain();

        // 2. Cold Clipper Stage (Asymmetric Distortion)
        // Characteristic JCM800 sound comes from a 10k cathode resistor stage clipping heavily on one side
        this._clipper = context.createWaveShaper();
        this._makeColdClipCurve();

        // 3. Tone Stack (Marshall)
        // High Mid focus

        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 100;

        this._eqMid = context.createBiquadFilter();
        this._eqMid.type = 'peaking';
        this._eqMid.frequency.value = 800; // Classic rock mid
        this._eqMid.Q.value = 1.0;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 3200;

        // 4. Presence (Power Amp High Bias)
        // Boosts very high freqs
        this._presenceFilter = context.createBiquadFilter();
        this._presenceFilter.type = 'highshelf';
        this._presenceFilter.frequency.value = 5000;

        // 5. Cab Sim (4x12 Greenbacks)
        // Closed back resonance (Thump) + Rolloff
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 3500;
        this._cabFilter.Q.value = 0.8;

        this._cabRes = context.createBiquadFilter();
        this._cabRes.type = 'peaking';
        this._cabRes.frequency.value = 90; // Closed back thump
        this._cabRes.gain.value = 4.0;
        this._cabRes.Q.value = 2.0;

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._preampGain);
        this._preampGain.connect(this._clipper);

        this._clipper.connect(this._eqBass);
        this._eqBass.connect(this._eqMid);
        this._eqMid.connect(this._eqTreble);
        this._eqTreble.connect(this._presenceFilter);

        this._presenceFilter.connect(this._cabRes);
        this._cabRes.connect(this._cabFilter);
        this._cabFilter.connect(this._master);
        this._master.connect(this._output);

        // Bypass Logic
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._gain = 0.5;
        this._bass = 0.5;
        this._mid = 0.5;
        this._treble = 0.5;
        this._presence = 0.5;
        this._vol = 0.5;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeColdClipCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            let x = i * 2 / n - 1;
            // Cold clipper: Clips hard on negative side, soft on positive
            // Or vice versa. Let's do heavy asymmetric.
            if (x > 0) {
                curve[i] = Math.tanh(x * 2.0); // More headroom
            } else {
                curve[i] = Math.tanh(x * 0.5); // Less gain/earlier clip? No wait.
                // Cold clipper BIASED so it clips early on one side.
                // Let's create a shifted sigmoid.
                curve[i] = Math.tanh(x * 4.0); // Hard clip
            }
            // Add some crossover distortion simulation?
            // Simple Asymmetry is key for Marshall "Roar".
            // Let's do: Positive = Soft, Negative = Hard.
            if (x > 0) curve[i] = Math.tanh(x);
            else curve[i] = Math.max(-0.5, Math.tanh(x * 2.0)); // Hard floor
        }
        this._clipper.curve = curve;
    }

    _updateDSP() {
        // Preamp Gain (Crunch)
        // Range 1 to 50
        const drive = 1.0 + (this._gain * 49.0);
        this._preampGain.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        // EQ (+/- 10dB)
        this._eqBass.gain.setTargetAtTime((this._bass - 0.5) * 20.0, this._context.currentTime, 0.1);
        this._eqMid.gain.setTargetAtTime((this._mid - 0.5) * 20.0, this._context.currentTime, 0.1);
        this._eqTreble.gain.setTargetAtTime((this._treble - 0.5) * 20.0, this._context.currentTime, 0.1);

        // Presence (0 to +10dB)
        this._presenceFilter.gain.setTargetAtTime(this._presence * 10.0, this._context.currentTime, 0.1);

        // Master Volume
        const out = this._vol * 2.0;

        if (this._isBypassed) {
            this._master.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(1, this._context.currentTime, 0.05);
        } else {
            this._master.gain.setTargetAtTime(out, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
        }
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        this._updateDSP();
    }

    setParamValue(name, value) {
        if (!Number.isFinite(value)) return;
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'gain': this._gain = value; break;
            case 'bass': this._bass = value; break;
            case 'mid': this._mid = value; break;
            case 'treble': this._treble = value; break;
            case 'presence': this._presence = value; break;
            case 'master': this._vol = value; break;
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
