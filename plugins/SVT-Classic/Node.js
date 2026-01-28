// SVT-Classic Node - Tube Bass Head (With Slap Boost)
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class SVTNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Tube Preamp Stage ---
        // Input Gain -> WaveShaper -> EQ

        this._gainStage = context.createGain(); // Driven by Gain knob
        this._tubeShaper = context.createWaveShaper();
        this._makeTubeCurve();

        // --- Ultra Filters ---
        // Ultra Lo: Cut mid, Boost bass
        this._filterUltraLo = context.createBiquadFilter();
        this._filterUltraLo.type = 'lowshelf';
        this._filterUltraLo.frequency.value = 600; // Wide shelf
        this._filterUltraLo.gain.value = 0;

        // Ultra Hi: Boost 8kHz
        this._filterUltraHi = context.createBiquadFilter();
        this._filterUltraHi.type = 'highshelf';
        this._filterUltraHi.frequency.value = 8000;
        this._filterUltraHi.gain.value = 0;

        // --- Tone Stack ---
        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 40;

        this._eqMid = context.createBiquadFilter();
        this._eqMid.type = 'peaking';
        this._eqMid.Q.value = 1.0;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 4000;

        // --- Cab Sim ---
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 3500;
        this._cabFilter.Q.value = 0.7;

        this._cabBody = context.createBiquadFilter();
        this._cabBody.type = 'peaking';
        this._cabBody.frequency.value = 150;
        this._cabBody.gain.value = 3.0; // Thump
        this._cabBody.Q.value = 1.5;

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._gainStage);
        this._gainStage.connect(this._tubeShaper);

        this._tubeShaper.connect(this._filterUltraLo);
        this._filterUltraLo.connect(this._filterUltraHi);
        this._filterUltraHi.connect(this._eqBass);
        this._eqBass.connect(this._eqMid);
        this._eqMid.connect(this._eqTreble);

        this._eqTreble.connect(this._cabBody);
        this._cabBody.connect(this._cabFilter);
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
        this._midFreq = 1; // 0=220, 1=800, 2=3k
        this._treble = 0.5;
        this._uLo = false;
        this._uHi = false;
        this._isSlap = false; // New State
        this._vol = 0.7;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeTubeCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            let x = i * 2 / n - 1;
            if (x < -1) x = -1;
            if (x > 1) x = 1;
            curve[i] = Math.tanh(x * 1.5);
        }
        this._tubeShaper.curve = curve;
    }

    _updateDSP() {
        if (!this._isBypassed) {
            this._master.gain.value = this._vol;
        } else {
            this._master.gain.value = 0;
        }

        const drive = 1.0 + (this._gain * 19.0);
        this._gainStage.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        const midDb = (this._mid - 0.5) * 24.0;
        const bassDb = (this._bass - 0.5) * 24.0;
        const trebleDb = (this._treble - 0.5) * 24.0;

        this._eqBass.gain.setTargetAtTime(bassDb, this._context.currentTime, 0.1);
        this._eqMid.gain.setTargetAtTime(midDb, this._context.currentTime, 0.1);
        this._eqTreble.gain.setTargetAtTime(trebleDb, this._context.currentTime, 0.1);

        let mf = 800;
        if (this._midFreq < 0.5) mf = 220;
        else if (this._midFreq > 1.5) mf = 3000;

        this._eqMid.frequency.setTargetAtTime(mf, this._context.currentTime, 0.1);

        // Ultra/Slap Logic
        if (this._isSlap) {
            // Slap Mode: Aggressive Scoop + Treble Boost
            this._filterUltraLo.gain.setTargetAtTime(-15.0, this._context.currentTime, 0.1); // Deep cut at 600Hz
            this._filterUltraHi.gain.setTargetAtTime(12.0, this._context.currentTime, 0.1); // Boost high
        } else {
            // Normal / Ultra Modes
            if (this._uLo) {
                this._filterUltraLo.gain.setTargetAtTime(-10.0, this._context.currentTime, 0.1);
            } else {
                this._filterUltraLo.gain.setTargetAtTime(0.0, this._context.currentTime, 0.1);
            }

            this._filterUltraHi.gain.setTargetAtTime(this._uHi ? 9.0 : 0.0, this._context.currentTime, 0.1);
        }
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._bypassGain.gain.value = 1;
            this._master.gain.value = 0;
        } else {
            this._bypassGain.gain.value = 0;
            this._updateDSP();
        }
    }

    setParamValue(name, value) {
        if (!Number.isFinite(value)) return;
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'gain': this._gain = value; break;
            case 'bass': this._bass = value; break;
            case 'mid': this._mid = value; break;
            case 'midfreq': this._midFreq = Math.round(value * 2); break;
            case 'treble': this._treble = value; break;
            case 'master': this._vol = value; break;
            case 'ulo': this._uLo = (value > 0.5); break;
            case 'uhi': this._uHi = (value > 0.5); break;
            case 'slap': this._isSlap = (value > 0.5); break;
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
