// PitchShifter Node - Dual Delay Crossfade
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class PitchShifterNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        this._input = context.createGain();
        this._output = context.createGain();

        // Architecture:
        // Input -> Delay A -> Gain A -> Sum
        // Input -> Delay B -> Gain B -> Sum
        //
        // Delay Times are modulated by a Sawtooth LFO.
        // Gain A/B are modulated by a Triangle Window LFO.
        // Ideally, when Delay A "snaps" back (sawtooth reset), Gain A is 0.

        // 1. Delays
        this._delayA = context.createDelay(1.0);
        this._delayB = context.createDelay(1.0);
        this._delayBuffSize = 0.05; // 50ms window
        this._delayA.delayTime.value = this._delayBuffSize / 2;
        this._delayB.delayTime.value = this._delayBuffSize / 2;

        // 2. Gains (Windowing)
        this._gainA = context.createGain();
        this._gainB = context.createGain();

        // 3. LFOs
        // We need synchronized Sawtooths and Triangle windows.
        // It's hard to sync 4 oscillators perfectly in pure graph without drift.
        // Alternative: Use a ScriptProcessor or buffer source loop?
        // Let's try simple Oscillators first.

        // Delay Modulators (Sawtooth)
        this._modA = context.createOscillator();
        this._modA.type = 'sawtooth';
        this._modAmpA = context.createGain(); // Depth
        this._modAmpA.gain.value = this._delayBuffSize * 0.5; // Sweep half buffer?

        this._modB = context.createOscillator();
        this._modB.type = 'sawtooth';
        // Need to offset phase by 180 deg?
        // Standard oscillators don't support phase offset.
        // We can simulate B by inverting A? No, sawtooth inverted is still sawtooth but flipped slope.
        // We need Delay B to be halfway through its cycle when A resets.

        // Better approach for WebAudio Graph Pitch Shifting:
        // Use a DelayLine with a highly active LFO?
        // Actually, without an AudioWorklet, robust pitch shifting is very hard.
        // Let's implement a "Detuner" style pitch shifter which is easier.
        // Or acceptable glitchy one.

        // Let's go with a simplified "Vibrato" extreme for very short delays, 
        // or just accept we need to use a simpler method if not using Worklets.

        // WAIT! I can use a buffer loop for the LFOs to get perfect phase.
        // Determine buffer size for 1Hz.
        // But rate needs to change for Pitch.

        // --- SIMPLIFIED IMPLEMENTATION ---
        // Just one delay line modulated by sawtooth for "Doppler" shift.
        // It will click on reset.
        // To hide click, we duck the volume.

        // Let's try to make Delay A and Delay B working in tandem.
        // If I start Oscillator B later? No easy way to sync start time precisely repeatedly.

        // Plan B: Use a single buffer source with stereo channels containing the LFO shapes (Saw A, Window A, Saw B, Window B).
        // Then loop it at variable playbackRate.
        // This guarantees sync.

        this._bufferSource = context.createBufferSource();
        this._bufferSource.loop = true;

        // Create LFO Buffer
        const sampleRate = context.sampleRate;
        const length = sampleRate; // 1 second buffer
        const lfoBuffer = context.createBuffer(4, length, sampleRate);
        const dSawA = lfoBuffer.getChannelData(0);
        const dWinA = lfoBuffer.getChannelData(1);
        const dSawB = lfoBuffer.getChannelData(2);
        const dWinB = lfoBuffer.getChannelData(3);

        for (let i = 0; i < length; i++) {
            const phase = i / length; // 0 to 1
            const phaseB = (phase + 0.5) % 1.0; // 180 deg offset

            // Sawtooth 0 to 1 (Ramping Up -> Pitch Drop // Ramping Down -> Pitch Rise)
            // We want centered -0.5 to 0.5?
            // Let's use 0 to 1 scaling later.

            dSawA[i] = phase;
            dSawB[i] = phaseB;

            // Window (Triangle): 0 at reset, 1 in middle
            // Phase 0: Reset (Click). Win should be 0.
            // Phase 0.5: Middle. Win should be 1.
            // Triangle: 
            dWinA[i] = 1 - Math.abs((phase * 2) - 1); // 0->1->0
            dWinB[i] = 1 - Math.abs((phaseB * 2) - 1);
        }

        this._bufferSource.buffer = lfoBuffer;

        // Splitter to access 4 channels
        this._splitter = context.createChannelSplitter(4);
        this._bufferSource.connect(this._splitter);

        // Channel 0 (Saw A) -> Delay A Time
        this._modGainA = context.createGain();
        this._splitter.connect(this._modGainA, 0);
        this._modGainA.connect(this._delayA.delayTime);

        // Channel 1 (Win A) -> Gain A
        this._splitter.connect(this._gainA.gain, 1);

        // Channel 2 (Saw B) -> Delay B Time
        this._modGainB = context.createGain();
        this._splitter.connect(this._modGainB, 2);
        this._modGainB.connect(this._delayB.delayTime);

        // Channel 3 (Win B) -> Gain B
        this._splitter.connect(this._gainB.gain, 3);

        // Start LFO
        this._bufferSource.start();

        // Check: Delay Window Size.
        // If Saw goes 0..1. delayTime needs to go 0..WindowSize.
        // So ModGain should be WindowSize.

        const window = 0.05; // 50ms
        this._modGainA.gain.value = window;
        this._modGainB.gain.value = window;

        // Connections
        // Input -> Delays
        this._input.connect(this._delayA);
        this._input.connect(this._delayB);

        // Delays -> Gains
        this._delayA.connect(this._gainA);
        this._delayB.connect(this._gainB);

        // Mix Output
        this._dryGain = context.createGain();
        this._wetGain = context.createGain();

        this._input.connect(this._dryGain);

        this._gainA.connect(this._wetGain);
        this._gainB.connect(this._wetGain);

        this._dryGain.connect(this._output);
        this._wetGain.connect(this._output);

        // Bypass
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // State
        this._isBypassed = false;
        this._semitones = 0;
        this._mix = 0.5;
        this._detune = 0;

        this._updateDSP();

        AudioNode.prototype.connect.call(this, this._input);
    }

    _updateDSP() {
        if (!this._isBypassed) {
            this._dryGain.gain.value = 1.0 - this._mix;
            this._wetGain.gain.value = this._mix;
        } else {
            this._dryGain.gain.value = 0;
            this._wetGain.gain.value = 0;
        }

        // Pitch Calculation
        // Frequency shift = - (DelaySlope * FreqLFO)
        // Wait.
        // Pitch Ratio = 1 - (Slope)
        // Slope = (WindowSize * LFOFreq) 
        // Ratio = 1 - (WindowSize * LFOFreq) ? 
        // For Sawtooth Down (Increasing delay): Pitch drops.
        // For Sawtooth Up (Decreasing delay): Pitch rises.

        // Target Ratio = 2^(semitones/12)
        // Ratio = (1 - Rate * Window)
        // Rate = (1 - Ratio) / Window

        let ratio = Math.pow(2, (this._semitones + this._detune) / 12);

        if (ratio < 0.25) ratio = 0.25; // Safety limits
        if (ratio > 4.0) ratio = 4.0;

        // If we want Pitch UP: Ratio > 1.
        // Means we need NEGATIVE slope (Decreasing delay).
        // My Sawtooth 0->1 is Positive Slope.
        // So standard wiring creates Pitch DOWN (1 - X).

        // To get Pitch Up, we need to invert the Sawtooth modulation depth?
        // Or change LFO direction?
        // Changing LFO direction = negative playback rate?

        // Let's use modulation Gain polarity.
        // Slope = ModGain * Frequency.
        // PitchShift = 1 - Slope.
        // If we want Ratio 1.5 (Fifth up):
        // 1.5 = 1 - Slope -> Slope = -0.5.
        // If we want Ratio 0.5 (Octave down):
        // 0.5 = 1 - Slope -> Slope = 0.5.

        // So Slope = 1 - Ratio.

        const window = 0.05; // 50ms fixed window
        const slope = 1 - ratio;

        // Slope = Gain * Freq.
        // We can fix Freq or Gain.
        // Fixing Gain (Window size) is better for artifact management (constant overlap).
        // So we vary Frequency.
        // Freq = Slope / Gain.

        let freq = slope / window;

        // Note: Freq can be negative!
        // abs(Freq) is the LFO rate.
        // If freq is negative, we need to invert the sawtooth slope.
        // We can do this by inverting the modGain.

        const absFreq = Math.abs(freq);
        if (absFreq < 0.01) {
            // Near zero shift
            this._bufferSource.playbackRate.setTargetAtTime(0, this._context.currentTime, 0.1);
        } else {
            this._bufferSource.playbackRate.setTargetAtTime(absFreq, this._context.currentTime, 0.1);
        }

        // Direction
        // If slope is positive (Pitch Down), we need Increasing Delay (Positive Gain).
        // If slope is negative (Pitch Up), we need Decreasing Delay (Negative Gain).

        // My LFO buffer 0->1 is Increasing.
        // So Positive Gain = Pitch Down.
        // Negative Gain = Pitch Up.

        // Apply polarity
        const dir = (freq >= 0) ? 1 : -1;
        // Also apply window size scaling
        const gainVal = window * dir;

        this._modGainA.gain.setTargetAtTime(gainVal, this._context.currentTime, 0.1);
        this._modGainB.gain.setTargetAtTime(gainVal, this._context.currentTime, 0.1);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._dryGain.gain.value = 0;
            this._wetGain.gain.value = 0;
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
            case 'pitch': this._semitones = value; this._updateDSP(); break;
            case 'mix': this._mix = value; this._updateDSP(); break;
            case 'detune': this._detune = value; this._updateDSP(); break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._bufferSource.stop();
        this._input.disconnect();
        this._output.disconnect();
    }
}
