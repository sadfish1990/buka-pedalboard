// Acid Voice - Monophonic 303 Architecture
export default class Voice {
    constructor(context, destination) {
        this.context = context;
        this.output = context.createGain();
        this.output.connect(destination);
        this.output.gain.value = 1;

        // --- OSC ---
        this.osc = context.createOscillator();
        this.osc.type = 'sawtooth';

        // --- FILTER ---
        this.filter = context.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.Q.value = 1;

        // --- AMP ---
        this.amp = context.createGain();
        this.amp.gain.value = 0;

        // --- GRAPH ---
        this.osc.connect(this.filter);
        this.filter.connect(this.amp);
        this.amp.connect(this.output);

        this.osc.start();

        // State
        this.note = -1;
        this.params = {
            wave: 'sawtooth',
            tuning: 0, // Cents
            cutoff: 400,
            res: 5,
            envMod: 1000,
            decay: 0.2, // Seconds
            accent: 0.5 // 0 to 1
        };
    }

    setParams(params) {
        Object.assign(this.params, params);
        if (this.osc.type !== this.params.wave) this.osc.type = this.params.wave;
        this.filter.Q.value = this.params.res;
        // Tuning updated on note trigger mostly, or dynamic here?
        // Let's update Detune immediately
        this.osc.detune.value = this.params.tuning;
    }

    triggerAttack(note, time, velocity = 1) {
        this.note = note;
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        this.osc.frequency.setValueAtTime(freq, time);

        // Accent Logic
        // In 303, Accent shortens decay time (punchier) and boosts resonance/volume.
        // We'll simulate simply: High velocity = Accent.
        // Or if 'accent' knob is high, all notes get it? 
        // Real 303 has 'Accent' knob setting the intensity of accented steps.
        // For this synth, let's assume Velocity > 0.8 triggers accent logic if we had a sequencer.
        // But for live play, we just use the knobs directly.

        const isAccent = velocity > 0.9;
        const accentBoost = isAccent ? this.params.accent * 2 : 0; // Volume boost

        // --- ENV (Decay Only) ---
        // 303 Envelope is: Attack (Fixed fast ~3ms), Decay (Variable), Sustain (0), Release (Same as Decay usually)
        const A = 0.003;
        const D = this.params.decay;

        // AMP
        this.amp.gain.cancelScheduledValues(time);
        this.amp.gain.setValueAtTime(0, time);
        this.amp.gain.linearRampToValueAtTime(1 + (isAccent ? 0.5 : 0), time + A);
        this.amp.gain.setTargetAtTime(0, time + A, D / 3); // Expo decay

        // FILTER
        const baseFreq = this.params.cutoff;
        // Env mod amount: The amount the envelope adds to cutoff.
        // Accent adds MORE mod.
        const mod = this.params.envMod + (isAccent ? this.params.accent * 1000 : 0);
        const peak = Math.min(22000, baseFreq + mod);

        this.filter.frequency.cancelScheduledValues(time);
        this.filter.frequency.setValueAtTime(baseFreq, time);
        this.filter.frequency.linearRampToValueAtTime(peak, time + A);
        // 303 Filter decay is coupled with amp decay but has its own shape quirks.
        // We track the Amp decay time roughly.
        this.filter.frequency.setTargetAtTime(baseFreq, time + A, D / 3);
    }

    triggerRelease(time) {
        // Fast release on key up (Gate off)
        this.amp.gain.cancelScheduledValues(time);
        this.amp.gain.setTargetAtTime(0, time, 0.05);

        this.filter.frequency.cancelScheduledValues(time);
        this.filter.frequency.setTargetAtTime(this.params.cutoff, time, 0.05);
    }
}
