// AutoFunk Node - Emergency Recovery
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class AutoFunkNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // --- 1. Nodes ---
        this._input = context.createGain();
        this._output = context.createGain();

        // Filter - Initialize with SAFE values
        this._filter = context.createBiquadFilter();
        this._filter.type = 'lowpass';
        this._filter.frequency.value = 1000; // Safe Middle
        this._filter.Q.value = 1; // Safe Low Q

        // Output Gain
        this._outputGain = context.createGain();
        this._outputGain.gain.value = 1.0;

        // --- 2. Routing (Standard Series) ---
        // Input -> Filter -> OutGain -> Output
        this._input.connect(this._filter);
        this._filter.connect(this._outputGain);
        this._outputGain.connect(this._output);

        // Bypass Gain
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // --- 3. State ---
        this._savedLevel = 1.0;
        this._isBypassed = false;

        // Params defaults
        this._sensitivity = 0.5;
        this._rangeMode = 0;
        this._driveMode = 0;

        // Wire up
        AudioNode.prototype.connect.call(this, this._input);

        // Re-enable Analyzer safely
        this._startEnvelopeFollower();
    }

    _startEnvelopeFollower() {
        this._analyser = this._context.createAnalyser();
        this._analyser.fftSize = 256;
        this._input.connect(this._analyser); // Sidechain

        const buffer = new Float32Array(256);
        let envelope = 0;

        const loop = () => {
            if (!this._isBypassed) {
                this._analyser.getFloatTimeDomainData(buffer);
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
                const rms = Math.sqrt(sum / buffer.length) || 0;

                // Attack/Release
                let target = rms * (1 + this._sensitivity * 50);
                if (!isFinite(target)) target = 0;

                if (target > envelope) envelope = envelope * 0.5 + target * 0.5;
                else envelope = envelope * 0.95 + target * 0.05;

                // Frequency Mapping
                // UP Mode driven by envelope
                let freq = 100 + (envelope * 2000);

                // Safety Clamps
                if (!isFinite(freq)) freq = 500;
                freq = Math.max(50, Math.min(10000, freq));

                this._filter.frequency.setTargetAtTime(freq, this._context.currentTime, 0.02);
            }
            this._loopId = requestAnimationFrame(loop);
        };
        this._loopId = requestAnimationFrame(loop);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        this._isBypassed = bypassed;
        if (bypassed) {
            this._outputGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._updateMakeupGain(); // Restore correct gain
        }
    }

    _updateMakeupGain() {
        if (this._isBypassed) return;

        let baseGain = this._savedLevel;

        // BP and HP need more gain naturally
        if (this._filterMode === 1) baseGain *= 2.5; // BP Boost
        if (this._filterMode === 2) baseGain *= 2.0; // HP Boost

        this._outputGain.gain.value = baseGain;
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'sens':
                this._sensitivity = value;
                break;
            case 'peak':
                this._peak = value;
                // Q Mapping: 1 to 35 (Very resonant for vocal/vowel sounds)
                this._filter.Q.value = 1.0 + (value * 34.0);
                // Compensation gain to prevent volume drop at high Q
                if (!this._isBypassed) this._updateMakeupGain();
                break;
            case 'filter':
                if (value < 0.33) { this._filter.type = 'lowpass'; this._filterMode = 0; }
                else if (value < 0.66) { this._filter.type = 'bandpass'; this._filterMode = 1; }
                else { this._filter.type = 'highpass'; this._filterMode = 2; }
                this._updateMakeupGain();
                break;
            case 'drive':
                this._driveMode = value > 0.5 ? 1 : 0;
                break;
            case 'range':
                this._rangeMode = value > 0.5 ? 1 : 0;
                break;
            case 'level':
                this._savedLevel = value * 2;
                this._updateMakeupGain();
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        if (this._loopId) cancelAnimationFrame(this._loopId);
        this._input.disconnect();
        this._output.disconnect();
    }
}
