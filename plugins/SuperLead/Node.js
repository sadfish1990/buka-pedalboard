// SuperLead Node - SLO-100 Emulator
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class SuperLeadNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> Preamp Gain (OD) -> Cascaded Clipping Stages -> Tone Stack -> Presence/Depth -> Cab Sim -> Output

        // 1. Preamp Gain
        this._preampGain = context.createGain();

        // 2. Cascaded Gain Stages (The "Liquid" Sound)
        // 4 stages of soft clipping in series?
        // Or one massive shaper.
        // The SLO magic is smooth compression.
        this._clipper = context.createWaveShaper();
        this._makeLeadCurve();

        // 3. Tone Stack (Marshall Style but shifted)
        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 120;

        this._eqMid = context.createBiquadFilter();
        this._eqMid.type = 'peaking';
        this._eqMid.frequency.value = 700;
        this._eqMid.Q.value = 1.0;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 3500;

        // 4. Power Amp Controls
        // Presence (High boost)
        this._presence = context.createBiquadFilter();
        this._presence.type = 'highshelf';
        this._presence.frequency.value = 4000;

        // Depth (Low resonance boost) modification to feedback loop
        this._depth = context.createBiquadFilter();
        this._depth.type = 'lowshelf'; // Or peaking at resonance
        this._depth.frequency.value = 80;

        // 5. Cab Sim (4x12 V30)
        // Mid bump + High rolloff
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 4000;
        this._cabFilter.Q.value = 0.6;

        this._cabRes = context.createBiquadFilter();
        this._cabRes.type = 'peaking';
        this._cabRes.frequency.value = 2500; // V30 mid spike
        this._cabRes.gain.value = 3.0;
        this._cabRes.Q.value = 1.0;

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._preampGain);
        this._preampGain.connect(this._clipper);

        this._clipper.connect(this._eqBass);
        this._eqBass.connect(this._eqMid);
        this._eqMid.connect(this._eqTreble);

        this._eqTreble.connect(this._presence);
        this._presence.connect(this._depth);

        this._depth.connect(this._cabRes);
        this._cabRes.connect(this._cabFilter);

        this._cabFilter.connect(this._master);
        this._master.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._gain = 0.5; // Overdrive
        this._bass = 0.5;
        this._mid = 0.5;
        this._treble = 0.5;
        this._presCoeff = 0.5;
        this._depthCoeff = 0.5;
        this._vol = 0.5;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeLeadCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = i * 2 / n - 1;
            // High gain compression sigmoid
            // Very steep center
            curve[i] = Math.tanh(x * 4.0) * 0.9;
            // Add slight even harmonics?
            // (x + 0.1x^2)
        }
        this._clipper.curve = curve;
    }

    _updateDSP() {
        if (this._isBypassed) {
            this._master.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(1, this._context.currentTime, 0.05);
        } else {
            this._master.gain.setTargetAtTime(this._vol * 2.0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
        }

        // Preamp Gain (Overdrive)
        // SLO has tons of gain. 
        const drive = 1.0 + (this._gain * 99.0);
        this._preampGain.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        // EQ
        this._eqBass.gain.value = (this._bass - 0.5) * 20.0;
        this._eqMid.gain.value = (this._mid - 0.5) * 20.0;
        this._eqTreble.gain.value = (this._treble - 0.5) * 20.0;

        // Presence / Depth
        this._presence.gain.value = this._presCoeff * 10.0;
        this._depth.gain.value = this._depthCoeff * 10.0;
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
            case 'presence': this._presCoeff = value; break;
            case 'depth': this._depthCoeff = value; break;
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
