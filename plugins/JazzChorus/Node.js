// JazzChorus Node - Stereo Clean Amp
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class JazzChorusNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain(); // Stereo output

        // --- Architecture ---
        // Input -> Preamp (Cleaner) -> Distortion (Optional) -> EQ -> Stereo Split -> Chorus -> Cab Sim -> Output

        // 1. Distortion Circuit (The dubious "Dist" knob)
        this._distGain = context.createGain();
        this._distShaper = context.createWaveShaper();
        this._makeSoftClipCurve();

        // 2. EQ (Clean solid state)
        this._eqBass = context.createBiquadFilter();
        this._eqBass.type = 'lowshelf';
        this._eqBass.frequency.value = 100;

        this._eqMid = context.createBiquadFilter();
        this._eqMid.type = 'peaking';
        this._eqMid.frequency.value = 1000;
        this._eqMid.Q.value = 1.0;

        this._eqTreble = context.createBiquadFilter();
        this._eqTreble.type = 'highshelf';
        this._eqTreble.frequency.value = 5000;

        // 3. Stereo Chorus Engine
        // Left: Dry
        // Right: Wet (Pitch modulated)
        // Or "Dimensional": Wet1 Left, Wet2 Right?
        // JC-120 Schematic:
        // One speaker is Dry + Chorus, other is Dry - Chorus?
        // Actually: Channel B (Effect) goes to one amp, Channel A (Dry) to other?
        // Let's implement true dimensional stereo:
        // Left Channel: Dry Signal
        // Right Channel: Modulated Signal

        this._splitter = context.createChannelSplitter(2); // Wait, input is mono usually.
        // We output stereo.

        this._dryPath = context.createGain();
        this._wetPath = context.createDelay();
        this._wetPath.delayTime.value = 0.005; // 5ms base delay

        // LFO for Chorus
        this._lfo = context.createOscillator();
        this._lfo.type = 'sine';
        this._lfo.frequency.value = 0.5; // Hz
        this._lfoGain = context.createGain(); // Depth
        this._lfoGain.gain.value = 0.002;

        this._lfo.connect(this._lfoGain);
        this._lfoGain.connect(this._wetPath.delayTime);
        this._lfo.start();

        // Vibrato Mode?
        // Just kills the dry signal? Toggle switch usually: Off, Chorus, Vib.

        // 4. Cab Sim (Stereo Pair)
        this._cabLeft = context.createBiquadFilter();
        this._cabLeft.type = 'lowpass';
        this._cabLeft.frequency.value = 6000; // Bright cones

        this._cabRight = context.createBiquadFilter(); // Cloning for stereo symmetry?
        this._cabRight.type = 'lowpass';
        this._cabRight.frequency.value = 6000;

        // Stereo Merger
        this._merger = context.createChannelMerger(2);

        this._master = context.createGain();

        // Wiring
        this._input.connect(this._distGain);
        this._distGain.connect(this._distShaper);
        this._distShaper.connect(this._eqBass);
        this._eqBass.connect(this._eqMid);
        this._eqMid.connect(this._eqTreble);

        // Split Point
        // Left = Mixer (Dry)
        this._eqTreble.connect(this._dryPath);
        this._dryPath.connect(this._cabLeft);
        this._cabLeft.connect(this._merger, 0, 0); // Out 0

        // Right = Delay (Wet)
        this._eqTreble.connect(this._wetPath);
        this._wetPath.connect(this._cabRight);
        this._cabRight.connect(this._merger, 0, 1); // Out 1

        this._merger.connect(this._master);
        this._master.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._drive = 0.0;
        this._bass = 0.5;
        this._mid = 0.5;
        this._treble = 0.5;
        this._speed = 0.5;
        this._depth = 0.5;
        this._mode = 1; // 0=Off, 1=Chorus, 2=Vib
        this._vol = 0.7;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeSoftClipCurve() {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = i * 2 / n - 1;
            curve[i] = Math.tanh(x);
        }
        this._distShaper.curve = curve;
    }

    _updateDSP() {
        // Master Volume
        if (this._isBypassed) {
            this._master.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(1, this._context.currentTime, 0.05);
        } else {
            this._master.gain.setTargetAtTime(this._vol * 2.0, this._context.currentTime, 0.05);
            this._bypassGain.gain.setTargetAtTime(0, this._context.currentTime, 0.05);
        }

        // Distortion (Input Gain)
        const drv = 1.0 + (this._drive * 20.0);
        this._distGain.gain.setTargetAtTime(drv, this._context.currentTime, 0.1);

        // EQ
        this._eqBass.gain.setTargetAtTime((this._bass - 0.5) * 20.0, this._context.currentTime, 0.1);
        this._eqMid.gain.setTargetAtTime((this._mid - 0.5) * 20.0, this._context.currentTime, 0.1);
        this._eqTreble.gain.setTargetAtTime((this._treble - 0.5) * 20.0, this._context.currentTime, 0.1);

        // Chorus Mode
        // 0: Off (Both speakers Dry)
        // 1: Chorus (Left Dry, Right Wet)
        // 2: Vibrato (Both Wet? Or Left Muted, Right Wet?) Use Dry/Wet mix to sim.

        let dryLvl = 1.0;
        let wetLvl = 1.0;

        if (this._mode == 0) { // Off
            // Both dry? Or just mono dry.
            // Usually JC-120 behaves like normal dual mono amp when off.
            // Let's output dry to both.
            // Re-route? Too complex.
            // Just mute wet path and pan dry?
            // Let's implement standard Left=Dry, Right=Wet logic.
            // If Off: Wet path gets Dry signal? (Delay time 0) - Hard to zero delay.
            // Let's just Mute Wet path and send Dry to both channels?
            // Limitation of static graph.
            // Simplified: Off = Mono output (Left only? No).
            // Let's keep Left Channel active (Dry). Right Channel Muted? Then it's mono left.
            wetLvl = 0.0;
            // To make it dual mono, we'd need dry signal in Right channel too.
            // Assume the user has a stereo downstream?
        } else if (this._mode == 1) { // Chorus
            dryLvl = 1.0;
            wetLvl = 1.0;
        } else if (this._mode == 2) { // Vibrato
            dryLvl = 0.0; // Kill dry reference -> Pure pitch modulation
            wetLvl = 1.0;
        }

        this._dryPath.gain.setTargetAtTime(dryLvl, this._context.currentTime, 0.1);

        // LFO
        // Mode 1 (Chorus) = Slow, wide?
        // Mode 2 (Vibrato) = Faster, deeper?
        // Knobs override.

        const rate = 0.1 + (this._speed * 9.9); // 0.1 to 10Hz
        const depth = this._depth * 0.004; // up to 4ms modulation

        this._lfo.frequency.setTargetAtTime(rate, this._context.currentTime, 0.1);

        if (this._mode == 0) {
            this._lfoGain.gain.setTargetAtTime(0, this._context.currentTime, 0.1);
        } else {
            this._lfoGain.gain.setTargetAtTime(depth, this._context.currentTime, 0.1);
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
            case 'dist': this._drive = value; break;
            case 'bass': this._bass = value; break;
            case 'mid': this._mid = value; break;
            case 'treble': this._treble = value; break;
            case 'speed': this._speed = value; break;
            case 'depth': this._depth = value; break;
            case 'mode': this._mode = value; break; // 0, 1, 2
            case 'vol': this._vol = value; break;
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
