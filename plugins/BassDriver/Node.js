// BassDriver Node - Tube Preamp Emulation
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class BassDriverNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // --- Architecture ---
        // Input -> Splitter -> [Clean Path] & [Drive Path] -> Mix -> Output

        // 1. Clean Path (Usually has some EQ or purely buffer?)
        // In BDDI, Blend mixes "SansAmp Tube Amp Emulation" with "Direct Instrument Signal".

        this._cleanGain = context.createGain();
        this._driveGain = context.createGain();

        // 2. Drive Path (SansAmp Circuit)
        // Presence Filter -> Pre-EQ -> Overdrive -> Post-EQ

        // Presence: Boosts upper mids/highs for attack "click".
        this._presenceFilter = context.createBiquadFilter();
        this._presenceFilter.type = 'peaking';
        this._presenceFilter.frequency.value = 3500; // ~3.5kHz typical
        this._presenceFilter.Q.value = 1.0;

        // Drive Stage: Soft Clipping
        this._driveShaper = context.createWaveShaper();
        this._makeTubeCurve(0.0);

        this._driveInputGain = context.createGain(); // Controls "Drive" amount

        // EQ Section (Active)
        // Bass: +/- 12dB at 80Hz
        // Treble: +/- 12dB at 3.2kHz
        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 80;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 3200;

        // Cab Sim? (Usually fixed LPF in SansAmp)
        this._cabFilter = context.createBiquadFilter();
        this._cabFilter.type = 'lowpass';
        this._cabFilter.frequency.value = 5000; // Roll off harsh fizz
        this._cabFilter.Q.value = 0.5;

        // Level
        this._masterLevel = context.createGain();

        // Wiring
        this._input.connect(this._cleanGain);
        this._input.connect(this._presenceFilter); // Start of drive path

        // Drive Path Chain
        this._presenceFilter.connect(this._driveInputGain);
        this._driveInputGain.connect(this._driveShaper);
        this._driveShaper.connect(this._eqBass);
        this._eqBass.connect(this._eqTreble);
        this._eqTreble.connect(this._cabFilter);
        this._cabFilter.connect(this._driveGain);

        // Mixing
        this._cleanGain.connect(this._masterLevel);
        this._driveGain.connect(this._masterLevel);

        this._masterLevel.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._blend = 0.5;
        this._drive = 0.5;
        this._level = 0.8;
        this._bass = 0.5;
        this._treble = 0.5;
        this._presence = 0.5;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeTubeCurve(drive) {
        // Asymmetric soft clipping
        // Drive parameter pushes input gain, but curve shape is mostly fixed range -1..1
        // We simulate subtle asymmetry
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
            let x = i * 2 / n - 1;
            // Asymmetry: squash positives more than negatives? 
            // Or simple tanh is good enough for first pass.
            // Let's add slight 2nd harmonic bias.

            // Standard soft clip
            if (x < -1) x = -1;
            if (x > 1) x = 1;

            // Tanh-like
            curve[i] = Math.tanh(x) * 0.95 + (x * x * 0.05); // DC offset from x^2? Careful.
            // Better: 
            // curve[i] = Math.tanh(x); 
        }
        // Actually, let's use the standard S-curve, we control intensity via input gain.
        // Simple tanh is very tube-like.
        for (let i = 0; i < n; ++i) {
            const x = i * 2 / n - 1;
            curve[i] = Math.tanh(x);
        }
        this._driveShaper.curve = curve;
    }

    _updateDSP() {
        if (!this._isBypassed) {
            // Blend Logic
            // Clean: 1 -> 0
            // Drive: 0 -> 1
            // Usually SansAmp blends from pure dry to pure wet.
            this._cleanGain.gain.value = 1.0 - this._blend;
            this._driveGain.gain.value = this._blend;
            this._masterLevel.gain.value = this._level * 2.0; // Boost capable
        } else {
            this._cleanGain.gain.value = 0;
            this._driveGain.gain.value = 0;
            this._masterLevel.gain.value = 0;
        }

        // Drive Amount
        // Input gain into shaper.
        // Range: 1x to 50x (+34dB)
        const driveGain = 1.0 + (this._drive * 49.0);
        this._driveInputGain.gain.setTargetAtTime(driveGain, this._context.currentTime, 0.1);

        // Presence
        // Boosts 3.5k usually. Range +/- 10dB?
        // Or SansAmp "Presence" is often just a boost.
        // Let's map 0-1 to 0dB to +15dB
        const presDb = this._presence * 15.0;
        this._presenceFilter.gain.setTargetAtTime(presDb, this._context.currentTime, 0.1);

        // EQ
        // +/- 12dB typically. Center (0.5) = 0dB.
        const bassDb = (this._bass - 0.5) * 24.0;
        const trebleDb = (this._treble - 0.5) * 24.0;

        this._eqBass.gain.setTargetAtTime(bassDb, this._context.currentTime, 0.1);
        this._eqTreble.gain.setTargetAtTime(trebleDb, this._context.currentTime, 0.1);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._cleanGain.gain.value = 0;
            this._driveGain.gain.value = 0;
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
            case 'level': this._level = value; break;
            case 'blend': this._blend = value; break;
            case 'drive': this._drive = value; break;
            case 'treble': this._treble = value; break;
            case 'bass': this._bass = value; break;
            case 'presence': this._presence = value; break;
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
