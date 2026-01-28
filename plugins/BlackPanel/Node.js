// BlackPanel Node - '65 Twin Reverb Emulator (Fixed Bypass)
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class BlackPanelNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---

        // 1. Bright Switch
        this._brightFilter = context.createBiquadFilter();
        this._brightFilter.type = 'highshelf';
        this._brightFilter.frequency.value = 2000;
        this._brightFilter.gain.value = 0;

        // 2. Preamp
        this._preamp = context.createWaveShaper();
        this._makeWarmCurve();

        this._driveGain = context.createGain();

        // 3. Tone Stack
        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 80;

        this._eqMid = context.createBiquadFilter();
        this._eqMid.type = 'peaking';
        this._eqMid.frequency.value = 400;
        this._eqMid.Q.value = 1.0;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 3500;

        // 4. Reverb
        this._reverb = this._createReverbEngine();
        this._reverbMix = context.createGain();

        this._dryPath = context.createGain();

        // 5. Cab Sim
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 4500;
        this._cabFilter.Q.value = 0.5;

        this._cabRes = context.createBiquadFilter();
        this._cabRes.type = 'peaking';
        this._cabRes.frequency.value = 2500;
        this._cabRes.gain.value = 2.0;
        this._cabRes.Q.value = 1.0;

        // wiring
        this._input.connect(this._brightFilter);
        this._brightFilter.connect(this._driveGain);
        this._driveGain.connect(this._preamp);

        this._preamp.connect(this._eqBass);
        this._eqBass.connect(this._eqMid);
        this._eqMid.connect(this._eqTreble);

        this._eqTreble.connect(this._dryPath);
        this._eqTreble.connect(this._reverb.input);

        this._reverb.output.connect(this._reverbMix);

        this._cabInput = context.createGain();
        this._dryPath.connect(this._cabInput);
        this._reverbMix.connect(this._cabInput);

        this._cabInput.connect(this._cabRes);
        this._cabRes.connect(this._cabFilter);

        // Master Output Logic (Fixed)
        this._master = context.createGain();
        this._cabFilter.connect(this._master);
        this._master.connect(this._output);

        // Bypass Logic
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._vol = 0.5;
        this._bass = 0.5;
        this._mid = 0.5;
        this._treble = 0.5;
        this._reverbLvl = 0.0;
        this._bright = false;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeWarmCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            let x = i * 2 / n - 1;
            curve[i] = Math.tanh(x);
        }
        this._preamp.curve = curve;
    }

    _createReverbEngine() {
        const duration = 2.0;
        const rate = this._context.sampleRate;
        const length = rate * duration;
        const impulse = this._context.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.pow(0.01, i / length);
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }

        const convolver = this._context.createConvolver();
        convolver.buffer = impulse;

        return { input: convolver, output: convolver };
    }

    _updateDSP() {
        // Robust gain mixing - never disconnect nodes
        const drive = (this._vol * 12.0);
        this._driveGain.gain.setTargetAtTime(drive, this._context.currentTime, 0.1);

        this._eqBass.gain.setTargetAtTime((this._bass - 0.5) * 20.0, this._context.currentTime, 0.1);
        this._eqMid.gain.setTargetAtTime((this._mid - 0.5) * 15.0, this._context.currentTime, 0.1);
        this._eqTreble.gain.setTargetAtTime((this._treble - 0.5) * 20.0, this._context.currentTime, 0.1);

        this._brightFilter.gain.setTargetAtTime(this._bright ? 6.0 : 0.0, this._context.currentTime, 0.1);
        this._reverbMix.gain.setTargetAtTime(this._reverbLvl * 1.5, this._context.currentTime, 0.1);

        if (this._isBypassed) {
            this._master.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(1, this._context.currentTime, 0.05);
        } else {
            this._master.gain.setTargetAtTime(1, this._context.currentTime, 0.05);
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
            case 'vol': this._vol = value; break;
            case 'bass': this._bass = value; break;
            case 'mid': this._mid = value; break;
            case 'treble': this._treble = value; break;
            case 'reverb': this._reverbLvl = value; break;
            case 'bright': this._bright = (value > 0.5); break;
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
