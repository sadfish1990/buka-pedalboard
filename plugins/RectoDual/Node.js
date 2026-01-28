// RectoDual Node - Mesa Dual Rectifier Emulator
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class RectoDualNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> Preamp Gain -> Multi-Stage Clipping -> Tone Stack -> Presence -> Master -> Cab Sim -> Output

        // 1. Preamp (Massive Gain)
        this._preampGain = context.createGain();

        // 2. Rectifier Distortion (Loose, Fizzy, Heavy)
        // Simulated by asymmetric soft clipping + low pass filtering between stages (to reduce fizz slightly but keep the grind)
        this._clipper = context.createWaveShaper();
        this._makeRectoCurve();

        // 3. Tone Stack (Mesa Style)
        // Interactive passive EQ simulation.
        // Bass is PRE-distortion in some modes, but usually POST in Modern High Gain.
        // Let's stick to standard Post-Distortion EQ for stability.

        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 100;

        this._eqMid = context.createBiquadFilter();
        this._eqMid.type = 'peaking';
        this._eqMid.frequency.value = 600;
        this._eqMid.Q.value = 1.0;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 3000;

        // 4. Presence (Power Amp Highs)
        this._presence = context.createBiquadFilter();
        this._presence.type = 'highshelf';
        this._presence.frequency.value = 5000;

        // 5. Cab Sim (4x12 V30 Oversized Settings)
        // Deep resonance, scooped mids naturally.
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 4500;
        this._cabFilter.Q.value = 0.7;

        this._cabRes = context.createBiquadFilter();
        this._cabRes.type = 'peaking';
        this._cabRes.frequency.value = 75; // Low thump
        this._cabRes.gain.value = 5.0; // Massive low end
        this._cabRes.Q.value = 1.5;

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._preampGain);
        this._preampGain.connect(this._clipper);

        this._clipper.connect(this._eqBass);
        this._eqBass.connect(this._eqMid);
        this._eqMid.connect(this._eqTreble);

        this._eqTreble.connect(this._presence);

        this._presence.connect(this._cabRes);
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
        this._gain = 0.5;
        this._bass = 0.5;
        this._mid = 0.5;
        this._treble = 0.5;
        this._pres = 0.5;
        this._vol = 0.5;
        this._mode = 1; // 0=Vintage, 1=Modern

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeRectoCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        // "Spongey" feel = Soft clipping but deep saturation
        for (let i = 0; i < n; i++) {
            const x = i * 2 / n - 1;
            // Asymmetric: harder clip on one side (simulating diode rectification sag?)
            if (x > 0) {
                curve[i] = Math.tanh(x * 3.0);
            } else {
                curve[i] = Math.tanh(x * 5.0); // Harder on negative
            }
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

        // Gain
        // Modern Mode has more gain and presence
        const modeMult = (this._mode === 1) ? 1.5 : 1.0;

        const drive = 1.0 + (this._gain * 80.0 * modeMult);
        this._preampGain.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        // EQ
        this._eqBass.gain.value = (this._bass - 0.5) * 25.0; // Huge bass range
        this._eqMid.gain.value = (this._mid - 0.5) * 20.0;
        this._eqTreble.gain.value = (this._treble - 0.5) * 20.0;

        // Presence
        // Modern mode removes negative feedback -> Presence becomes VERY aggressive
        let presVal = (this._pres - 0.5) * 15.0;
        if (this._mode === 1) presVal += 5.0; // Boost highs in modern

        this._presence.gain.value = presVal;
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
            case 'presence': this._pres = value; break;
            case 'master': this._vol = value; break;
            case 'mode': this._mode = value; break;
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
