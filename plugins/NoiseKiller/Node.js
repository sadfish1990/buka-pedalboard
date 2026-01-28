// NoiseKiller Node - ISP Decimator Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class NoiseKillerNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // Gate gain (controlled by worklet)
        this._gateGain = context.createGain();
        this._gateGain.gain.value = 1.0;

        // Simple routing: Input -> Gate -> Output
        this._input.connect(this._gateGain);
        this._gateGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Wire CompositeAudioNode
        AudioNode.prototype.connect.call(this, this._input);

        // Gate parameters
        this._threshold = -40; // dB
        this._attackTime = 0.001; // 1ms
        this._releaseTime = 0.05; // 50ms

        // Envelope follower state
        this._envelope = 0;

        // Start processing
        this._startGateProcessing();
    }

    _startGateProcessing() {
        // Use ScriptProcessor for envelope following and gating
        // (In production, use AudioWorklet, but ScriptProcessor is simpler for demo)
        const bufferSize = 256;
        this._processor = this._context.createScriptProcessor(bufferSize, 1, 1);

        this._processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const sampleRate = this._context.sampleRate;

            // Calculate RMS of input
            let sum = 0;
            for (let i = 0; i < input.length; i++) {
                sum += input[i] * input[i];
            }
            const rms = Math.sqrt(sum / input.length);
            const dB = 20 * Math.log10(rms + 0.0001); // Avoid log(0)

            // Envelope follower
            const attackCoeff = Math.exp(-1 / (this._attackTime * sampleRate));
            const releaseCoeff = Math.exp(-1 / (this._releaseTime * sampleRate));

            if (dB > this._envelope) {
                this._envelope = attackCoeff * this._envelope + (1 - attackCoeff) * dB;
            } else {
                this._envelope = releaseCoeff * this._envelope + (1 - releaseCoeff) * dB;
            }

            // Gate decision
            let targetGain;
            if (this._envelope > this._threshold) {
                targetGain = 1.0; // Open
            } else {
                // Smooth fade below threshold
                const diff = this._threshold - this._envelope;
                targetGain = Math.max(0, 1 - (diff / 20)); // Fade over 20dB range
            }

            // Smooth gain changes
            this._gateGain.gain.setTargetAtTime(targetGain, this._context.currentTime, 0.01);
        };

        // Connect processor (silent, just for analysis)
        this._input.connect(this._processor);
        this._processor.connect(this._context.destination); // Needs to be connected to work
        this._processor.disconnect(this._context.destination); // But mute it
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            this._gateGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._gateGain.gain.value = 1.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'threshold':
                // Threshold: -60dB to 0dB
                this._threshold = -60 + (value * 60);
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
