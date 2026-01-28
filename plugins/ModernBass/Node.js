// ModernBass Node - Hi-Fi Solid State Amp
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class ModernBassNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> Contour (Scoop) -> Drive (Blendable) -> 4-Band Active EQ -> Limiter -> Output

        // 1. Input Gain
        this._inputGain = context.createGain();

        // 2. Contour Filter (Variable Mid Scoop)
        // GK-style contour: Deep cut at 500Hz, Boost at 50Hz/10kHz
        this._contourFilter = context.createBiquadFilter();
        this._contourFilter.type = 'peaking'; // Actually a notch/wide cut
        this._contourFilter.frequency.value = 500;
        this._contourFilter.Q.value = 0.5; // Wide

        // 3. Drive Section (Modern distortion engine)
        // CMOS-style clipping (Harder rails)
        this._driveInput = context.createGain();
        this._driveShaper = context.createWaveShaper();
        this._makeRailCurve();

        // Blend logic needed for Drive
        // Clean path (Contoured) -> EQ
        // Drive path (Contoured+Dist) -> EQ
        // We'll blend them before EQ.

        this._cleanPath = context.createGain();
        this._drivePath = context.createGain();
        this._driveMix = context.createGain(); // To sum them

        // 4. 4-Band EQ (Active)
        // Bass (Shelf 60Hz)
        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 60;

        // Lo-Mid (Peaking 250Hz)
        this._eqLoMid = context.createBiquadFilter();
        this._eqLoMid.type = 'peaking';
        this._eqLoMid.frequency.value = 250;
        this._eqLoMid.Q.value = 1.0;

        // Hi-Mid (Peaking 1kHz)
        this._eqHiMid = context.createBiquadFilter();
        this._eqHiMid.type = 'peaking';
        this._eqHiMid.frequency.value = 1000;
        this._eqHiMid.Q.value = 1.0;

        // Treble (Shelf 4kHz)
        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 4000;

        // 5. Cab Sim (Modern 4x10 w/ Tweeter)
        // Wider frequency response than SVT.
        // LPF @ 6kHz
        this._cabSim = context.createBiquadFilter();
        this._cabSim.type = 'lowpass';
        this._cabSim.frequency.value = 6000;

        // 6. Limiter (Compressor)
        this._limiter = context.createDynamicsCompressor();
        this._limiter.threshold.value = -10;
        this._limiter.knee.value = 10;
        this._limiter.ratio.value = 10; // Limiting
        this._limiter.attack.value = 0.005;
        this._limiter.release.value = 0.1;

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._inputGain);
        this._inputGain.connect(this._contourFilter);

        // Split to Clean/Drive
        this._contourFilter.connect(this._cleanPath);

        this._contourFilter.connect(this._driveInput);
        this._driveInput.connect(this._driveShaper);
        this._driveShaper.connect(this._drivePath);

        // Mix
        this._cleanPath.connect(this._driveMix);
        this._drivePath.connect(this._driveMix);

        // EQ Chain
        this._driveMix.connect(this._eqBass);
        this._eqBass.connect(this._eqLoMid);
        this._eqLoMid.connect(this._eqHiMid);
        this._eqHiMid.connect(this._eqTreble);

        this._eqTreble.connect(this._cabSim);
        this._cabSim.connect(this._limiter);
        this._limiter.connect(this._master);
        this._master.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._contour = 0.0;
        this._drive = 0.0; // Drive Amount
        this._blend = 0.0; // Mix of Drive
        this._bass = 0.5;
        this._loMid = 0.5;
        this._hiMid = 0.5;
        this._treble = 0.5;
        this._vol = 0.7;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeRailCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = i * 2 / n - 1;
            // Harder clipping than tube
            curve[i] = Math.tanh(x * 3.0); // Simple tanh but pushed harder by gain
        }
        this._driveShaper.curve = curve;
    }

    _updateDSP() {
        if (!this._isBypassed) {
            this._master.gain.value = this._vol;
        } else {
            this._master.gain.value = 0;
        }

        // Contour: Cuts mids at 500Hz.
        // Range 0 to -15dB.
        const cut = this._contour * -15.0;
        this._contourFilter.gain.setTargetAtTime(cut, this._context.currentTime, 0.1);

        // Drive Blend
        // We want constant power mix? Or linear.
        // Drive knob controls both Input Gain AND Mix?
        // Let's separate: "Drive" is gain, "Blend" is mix.
        // User asked for "ModernBass". Often has a "Drive" channel.
        // Let's map "Boost" knob to both Gain amount + Mix amount for simplicity if single knob?
        // Let's stick to separated: Drive Amount + Blend (Dry/Wet).

        // Drive Input Gain
        const driveAmt = 1.0 + (this._drive * 40.0);
        this._driveInput.gain.setTargetAtTime(driveAmt, this._context.currentTime, 0.1);

        // Blend
        this._cleanPath.gain.setTargetAtTime(1.0 - this._blend, this._context.currentTime, 0.1);
        this._drivePath.gain.setTargetAtTime(this._blend, this._context.currentTime, 0.1);

        // EQ (+/- 15dB)
        const eqRange = 15.0;
        this._eqBass.gain.value = (this._bass - 0.5) * 2.0 * eqRange;
        this._eqLoMid.gain.value = (this._loMid - 0.5) * 2.0 * eqRange;
        this._eqHiMid.gain.value = (this._hiMid - 0.5) * 2.0 * eqRange;
        this._eqTreble.gain.value = (this._treble - 0.5) * 2.0 * eqRange;
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
            case 'contour': this._contour = value; break;
            case 'drive': this._drive = value; break;
            case 'blend': this._blend = value; break;
            case 'bass': this._bass = value; break;
            case 'lomid': this._loMid = value; break;
            case 'himid': this._hiMid = value; break;
            case 'treble': this._treble = value; break;
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
