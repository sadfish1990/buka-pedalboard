// AnalogDelay Node - Carbon Copy Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class AnalogDelayNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // Delay line (max 600ms at 48kHz = 28800 samples)
        this._delayNode = context.createDelay(0.6);
        this._delayNode.delayTime.value = 0.3; // 300ms default

        // Feedback
        this._feedbackGain = context.createGain();
        this._feedbackGain.gain.value = 0.5;

        // BBD character: lowpass filter on feedback (dark repeats)
        this._bbdFilter = context.createBiquadFilter();
        this._bbdFilter.type = 'lowpass';
        this._bbdFilter.frequency.value = 2000; // Dark analog character
        this._bbdFilter.Q.value = 0.7;

        // Modulation (chorus on repeats)
        this._modLFO = context.createOscillator();
        this._modLFO.frequency.value = 0.5; // Slow chorus
        this._modLFO.start();

        this._modDepth = context.createGain();
        this._modDepth.gain.value = 0; // Off by default

        // Connect modulation to delay time
        this._modLFO.connect(this._modDepth);
        this._modDepth.connect(this._delayNode.delayTime);

        // Wet/Dry mix
        this._wetGain = context.createGain();
        this._wetGain.gain.value = 0.5;

        this._dryGain = context.createGain();
        this._dryGain.gain.value = 1.0;

        // Routing:
        // Input -> Dry -> Output
        // Input -> Delay -> BBD Filter -> Wet -> Output
        //              ↑
        //         Feedback ←

        this._input.connect(this._dryGain);
        this._dryGain.connect(this._output);

        this._input.connect(this._delayNode);
        this._delayNode.connect(this._bbdFilter);
        this._bbdFilter.connect(this._wetGain);
        this._wetGain.connect(this._output);

        // Feedback loop
        this._bbdFilter.connect(this._feedbackGain);
        this._feedbackGain.connect(this._delayNode);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0;
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Wire CompositeAudioNode
        AudioNode.prototype.connect.call(this, this._input);

        this._modEnabled = false;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            this._wetGain.gain.value = 0;
            this._dryGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            this._bypassGain.gain.value = 0;
            this._dryGain.gain.value = 1.0;
            this._wetGain.gain.value = this._savedMix || 0.5;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'delay':
                // Delay: 20ms to 600ms
                const delayTime = 0.02 + (value * 0.58);
                this._delayNode.delayTime.value = delayTime;
                break;
            case 'mix':
                // Mix: 0 = all dry, 1 = all wet
                const mix = value;
                this._wetGain.gain.value = mix;
                this._savedMix = mix;
                break;
            case 'regen':
                // Regen (feedback): 0 to 1.2 (can self-oscillate)
                this._feedbackGain.gain.value = value * 1.2;
                break;
            case 'mod':
                // Mod: 0 = off, 1 = max modulation
                // Modulation depth affects delay time slightly
                this._modDepth.gain.value = value * 0.002; // ±2ms wobble
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._modLFO.stop();
        this._input.disconnect();
        this._output.disconnect();
    }
}
