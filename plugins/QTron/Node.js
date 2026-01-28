// QTron Node - Envelope Filter / Auto-Wah
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class QTronNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // Input sensitivity
        this._inputGain = context.createGain();
        this._inputGain.gain.value = 1.0;

        // Resonant peaking filter (more dramatic than bandpass)
        this._filter = context.createBiquadFilter();
        this._filter.type = 'peaking';
        this._filter.Q.value = 20; // Extreme resonance
        this._filter.gain.value = 15; // Boost at resonant frequency
        this._filter.frequency.value = 500;

        // Output gain (compensate for filter loss)
        this._outputGain = context.createGain();
        this._outputGain.gain.value = 2.0; // Reduced since peaking boosts

        // Routing
        this._input.connect(this._inputGain);
        this._inputGain.connect(this._filter);
        this._filter.connect(this._outputGain);
        this._outputGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Initialize saved values
        this._savedMix = 2.0;

        // Wire CompositeAudioNode
        AudioNode.prototype.connect.call(this, this._input);

        // Envelope follower parameters
        this._range = 0.5; // 0-1
        this._sensitivity = 0.5;
        this._q = 10;
        this._mode = 0; // 0 = up, 1 = down

        // Start envelope follower
        this._startEnvelopeFollower();
    }

    _startEnvelopeFollower() {
        // Use ScriptProcessor for envelope following
        const bufferSize = 256;
        this._processor = this._context.createScriptProcessor(bufferSize, 1, 1);

        let envelope = 0;

        this._processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const sampleRate = this._context.sampleRate;

            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < input.length; i++) {
                sum += input[i] * input[i];
            }
            const rms = Math.sqrt(sum / input.length);

            // Envelope follower with attack/release
            const attackTime = 0.001; // 1ms - very fast attack
            const releaseTime = 0.15; // 150ms - slower release for more sustain
            const attackCoeff = Math.exp(-1 / (attackTime * sampleRate));
            const releaseCoeff = Math.exp(-1 / (releaseTime * sampleRate));

            if (rms > envelope) {
                envelope = attackCoeff * envelope + (1 - attackCoeff) * rms;
            } else {
                envelope = releaseCoeff * envelope + (1 - releaseCoeff) * rms;
            }

            // Apply sensitivity with much higher multiplier
            const scaledEnvelope = Math.min(1.0, envelope * this._sensitivity * 50);

            // Map envelope to frequency range (WIDER range for more dramatic effect)
            const minFreq = 80;
            const maxFreq = 5000;
            const freqRange = maxFreq - minFreq;

            let targetFreq;
            if (this._mode === 0) {
                // Up mode: higher signal = higher frequency
                targetFreq = minFreq + (scaledEnvelope * freqRange * this._range);
            } else {
                // Down mode: higher signal = lower frequency
                targetFreq = maxFreq - (scaledEnvelope * freqRange * this._range);
            }

            // Clamp frequency
            targetFreq = Math.max(minFreq, Math.min(maxFreq, targetFreq));

            // Smooth frequency changes (faster for more responsive)
            this._filter.frequency.setTargetAtTime(targetFreq, this._context.currentTime, 0.005);
        };

        // Connect processor (silent)
        this._input.connect(this._processor);
        this._processor.connect(this._context.destination);
        this._processor.disconnect(this._context.destination);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            this._outputGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._outputGain.gain.value = this._savedMix || 2.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'range':
                // Range: 0-1 (how much the filter sweeps)
                this._range = value;
                break;
            case 'q':
                // Q/Resonance: 5 to 30 (extreme for dramatic wah)
                this._q = 5 + (value * 25);
                this._filter.Q.value = this._q;
                break;
            case 'sensitivity':
                // Sensitivity: 0.1 to 5
                this._sensitivity = 0.1 + (value * 4.9);
                break;
            case 'mode':
                // Mode: 0 = up, 1 = down
                this._mode = value > 0.5 ? 1 : 0;
                break;
            case 'mix':
                // Mix/output level: 0.1x to 5x (compensate for filter loss)
                const mix = 0.1 + (value * 4.9);
                this._outputGain.gain.value = mix;
                this._savedMix = mix;
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        if (this._processor) {
            this._processor.disconnect();
        }
        this._input.disconnect();
        this._output.disconnect();
    }
}
