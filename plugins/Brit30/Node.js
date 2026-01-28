// Brit30 Node - Vox AC30 Top Boost Emulator
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class Brit30Node extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> Preamp (Class A) -> Top Boost Tone Stack -> Cut (Low Pass) -> Cab Sim -> Output
        // The AC30 has no negative feedback in power amp -> Smooth transition to distortion.

        // 1. Preamp (Chimey, compresses early)
        this._preampGain = context.createGain();
        this._clipper = context.createWaveShaper();
        this._makeClassACurve();

        // 2. Top Boost Tone Stack
        // Treble & Bass controls are highly interactive and passive.
        // No Middle control (it's fixed/dependant).
        // Standard Vox Stack topology.

        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 150;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 2500;

        // 3. Cut Control
        // The "Tone Cut" works backwards (turning it up cuts highs).
        // It's in the power amp.
        this._cutFilter = context.createBiquadFilter();
        this._cutFilter.type = 'lowpass';
        this._cutFilter.frequency.value = 20000; // Open by default

        // 4. Cab Sim (2x12 Alnico Blue)
        // Very distinct chime and upper-mid spike.
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 5000;
        this._cabFilter.Q.value = 0.5;

        this._cabRes = context.createBiquadFilter();
        this._cabRes.type = 'peaking';
        this._cabRes.frequency.value = 1500; // The Alnico chime freq
        this._cabRes.gain.value = 4.0;
        this._cabRes.Q.value = 0.8;

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._preampGain);
        this._preampGain.connect(this._clipper);

        this._clipper.connect(this._eqBass);
        this._eqBass.connect(this._eqTreble);
        this._eqTreble.connect(this._cutFilter);

        this._cutFilter.connect(this._cabRes);
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
        this._vol = 0.5; // Gain
        this._treble = 0.5;
        this._bass = 0.5;
        this._cut = 0.0; // 0 = No cut (Bright)
        this._masterVol = 0.5;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeClassACurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = i * 2 / n - 1;
            // Class A Soft clipping
            // Symmetrical but very soft knee -> "Creamy"
            // At high gains it squares off.
            // Arctan is good for this.
            curve[i] = (2 / Math.PI) * Math.atan(x * 2.0);
        }
        this._clipper.curve = curve;
    }

    _updateDSP() {
        if (this._isBypassed) {
            this._master.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(1, this._context.currentTime, 0.05);
        } else {
            this._master.gain.setTargetAtTime(this._masterVol * 2.0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
        }

        // Volume (Top Boost Gain)
        const drive = 1.0 + (this._vol * 30.0);
        this._preampGain.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        // EQ (Simplified interaction)
        this._eqBass.gain.value = (this._bass - 0.5) * 20.0;
        this._eqTreble.gain.value = (this._treble - 0.5) * 20.0;

        // Cut Control: 0 = 20kHz, 1 = 1kHz
        // It acts as a LPF moving down.
        const cutFreq = 20000 * Math.pow(0.05, this._cut); // Exponential drop
        this._cutFilter.frequency.setTargetAtTime(cutFreq, this._context.currentTime, 0.1);
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
            case 'gain': this._vol = value; break;
            case 'bass': this._bass = value; break;
            case 'treble': this._treble = value; break;
            case 'cut': this._cut = value; break;
            case 'master': this._masterVol = value; break;
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
