// AmpBox Node - SansAmp GT2 Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class AmpBoxNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // --- 1. Pre-Amp Tone Shaping (Based on Amp Type) ---
        // Simulates the characteristic frequency response of different amps
        this._preEq = context.createBiquadFilter();
        this._preEq.type = 'peaking';

        // --- 2. Gain Stage (Drive) ---
        this._driveGain = context.createGain();
        this._clipper = context.createWaveShaper();
        this._clipper.oversample = '4x';

        // --- 3. Post-Amp Tone Shaping (Cabinet/Mic Sim) ---
        this._cabSim = context.createConvolver(); // Ideal approach but simpler: Filter bank
        // We'll use filters to simulate mic placement for flexibility
        this._micFilter = context.createBiquadFilter();

        // --- 4. Active EQ (High/Low) ---
        this._lowShelf = context.createBiquadFilter();
        this._lowShelf.type = 'lowshelf';
        this._lowShelf.frequency.value = 100;
        this._highShelf = context.createBiquadFilter();
        this._highShelf.type = 'highshelf';
        this._highShelf.frequency.value = 3500;

        // --- 5. Output Level ---
        this._levelGain = context.createGain();

        // Routing
        this._input.connect(this._preEq);
        this._preEq.connect(this._driveGain);
        this._driveGain.connect(this._clipper);
        this._clipper.connect(this._micFilter);
        this._micFilter.connect(this._lowShelf);
        this._lowShelf.connect(this._highShelf);
        this._highShelf.connect(this._levelGain);
        this._levelGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Initial State
        this._micMode = 1; // Center
        this._modMode = 1; // Hi-Gain
        this._ampMode = 1; // British
        this._driveVal = 0.5;
        this._savedLevel = 1.0;

        this._updateAmpChar();

        // Wire
        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateAmpChar() {
        // AMP SWITCH: California (Mesa), British (Marshall), Tweed (Fender)
        if (this._ampMode === 0) { // California (Mesa) - Scooped, tight bass
            this._preEq.frequency.value = 300;
            this._preEq.gain.value = -5; // Pre-scoop
            this._preEq.Q.value = 1.0;
            this._clipper.curve = this._makeCurve(50 + (this._driveVal * 300), true); // Harder clipping
        }
        else if (this._ampMode === 1) { // British (Marshall) - Upper mid push
            this._preEq.frequency.value = 800;
            this._preEq.gain.value = 6; // Mid boost
            this._preEq.Q.value = 0.7;
            this._clipper.curve = this._makeCurve(30 + (this._driveVal * 200), false); // Crunchy
        }
        else { // Tweed (Fender) - Full range, warm
            this._preEq.frequency.value = 1500;
            this._preEq.gain.value = 3; // Upper presence
            this._preEq.Q.value = 0.5;
            this._clipper.curve = this._makeCurve(10 + (this._driveVal * 100), false); // Softer clip
        }

        // MOD SWITCH: Clean, Hi-Gain, Hot-Wired
        // Affects pre-gain amount basically
        let gainMult = 1.0;
        if (this._modMode === 0) gainMult = 1; // Clean
        else if (this._modMode === 1) gainMult = 20; // Hi-Gain (Crunch)
        else gainMult = 50; // Hot-Wired (Lead)

        this._driveGain.gain.value = 1 + (this._driveVal * gainMult);

        // MIC SWITCH: Classic (Distant), Center (Bright), Off-Axis (Darker)
        if (this._micMode === 0) { // Classic (Flat/Distant)
            this._micFilter.type = 'lowpass';
            this._micFilter.frequency.value = 5000;
            this._micFilter.Q.value = 0.5;
        }
        else if (this._micMode === 1) { // Center (Bright/Cone)
            this._micFilter.type = 'peaking';
            this._micFilter.frequency.value = 3000;
            this._micFilter.gain.value = 5; // Presence boost
            this._micFilter.Q.value = 1;
        }
        else { // Off-Axis (Darker/Edge)
            this._micFilter.type = 'highshelf';
            this._micFilter.frequency.value = 2000;
            this._micFilter.gain.value = -6; // Roll off highs
        }
    }

    _makeCurve(amount, hard) {
        const n = 44100;
        const curve = new Float32Array(n);
        const deg = Math.PI / 180;
        for (let i = 0; i < n; ++i) {
            const x = i * 2 / n - 1;
            if (hard) {
                // Harder knee for California
                curve[i] = Math.max(-1, Math.min(1, x * amount));
            } else {
                // Soft/Tube-like for British/Tweed
                curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
            }
        }
        return curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed; // Store bypass state
        if (bypassed) {
            this._levelGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._levelGain.gain.value = this._savedLevel || 1.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'drive': // 0-1
                this._driveVal = value;
                this._updateAmpChar();
                break;
            case 'level': // 0-1
                const lvl = value * 1.5;
                this._savedLevel = lvl;
                // Only update gain if NOT bypassed
                if (!this._isBypassed) {
                    this._levelGain.gain.value = lvl;
                }
                break;
            case 'high': // +/- 12dB
                this._highShelf.gain.value = (value - 0.5) * 24;
                break;
            case 'low': // +/- 12dB
                this._lowShelf.gain.value = (value - 0.5) * 24;
                break;
            case 'mic':
                // 3 discrete states: 0.0, 0.5, 1.0
                if (value < 0.25) this._micMode = 0;
                else if (value < 0.75) this._micMode = 1;
                else this._micMode = 2;
                this._updateAmpChar();
                break;
            case 'mod':
                if (value < 0.25) this._modMode = 0;
                else if (value < 0.75) this._modMode = 1;
                else this._modMode = 2;
                this._updateAmpChar();
                break;
            case 'amp':
                if (value < 0.25) this._ampMode = 0; // Cali
                else if (value < 0.75) this._ampMode = 1; // Brit
                else this._ampMode = 2; // Tweed
                this._updateAmpChar();
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._input.disconnect();
        this._output.disconnect();
    }
}
