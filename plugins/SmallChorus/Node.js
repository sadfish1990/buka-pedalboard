// SmallChorus Node - Analog Style BBD Simulation
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class SmallChorusNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // --- NODES ---
        this._input = context.createGain(); // Internal Input
        this._output = context.createGain(); // Final Output

        // Signal Split
        this._dryPath = context.createGain();
        this._wetPath = context.createGain();

        // 1. Wet Path (Chorus Engine)
        // Analog choruses often use ~10-20ms delay
        this._delay = context.createDelay(0.1); // Max 100ms
        this._delay.delayTime.value = 0.015; // 15ms base delay

        // LFO Modulation
        this._lfo = context.createOscillator();
        this._lfo.type = 'sine';
        this._lfo.frequency.value = 0.5; // Start slow

        this._lfoGain = context.createGain(); // Depth control
        this._lfoGain.gain.value = 0.002; // 2ms modulation depth (approx)

        // Tone shaping (Analog Warmth)
        this._filter = context.createBiquadFilter();
        this._filter.type = 'lowpass';
        this._filter.frequency.value = 4000; // Cut harsh highs

        // --- GRAPH ---
        // LFO -> Depth -> Delay.delayTime
        this._lfo.connect(this._lfoGain);
        this._lfoGain.connect(this._delay.delayTime);
        this._lfo.start();

        // Input -> Dry -> Output
        this._input.connect(this._dryPath);
        this._dryPath.connect(this._output);

        // Input -> Delay -> Filter -> Wet -> Output
        this._input.connect(this._delay);
        this._delay.connect(this._filter);
        this._filter.connect(this._wetPath);
        this._wetPath.connect(this._output);

        // Default Mix (50/50 is classic for Chorus)
        this._dryPath.gain.value = 1.0;
        this._wetPath.gain.value = 0.7; // Slightly lower wet to avoid phase cancellation volume drop

        // CRITICAL WIRING (Same pattern as SimpleIR)
        AudioNode.prototype.connect.call(this, this._input);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    // SAFE OVERRIDES (From SimpleIR fix)
    connect(...args) {
        return this._output.connect(...args);
    }

    disconnect(...args) {
        return this._output.disconnect(...args);
    }

    getParamValue(name) {
        return this._wamNode?.getParamValue(name);
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        const val = parseFloat(value);

        if (name === 'rate') {
            // Rate 0-10 -> 0.1Hz to 5Hz
            // Logarithmic feel roughly
            this._lfo.frequency.value = 0.1 + (val * 0.5);
        }

        if (name === 'depth') {
            // Depth Switch: 0 (Low) or 1 (High)
            // Low = Subtle shimmer, High = Deep warble
            if (val > 0.5) {
                // High Depth
                this._lfoGain.gain.setTargetAtTime(0.004, this._context.currentTime, 0.05); // 4ms swing
            } else {
                // Low Depth
                this._lfoGain.gain.setTargetAtTime(0.001, this._context.currentTime, 0.05); // 1ms swing
            }
        }
    }

    destroy() {
        super.destroy();
        try {
            this._lfo.stop();
            this._input.disconnect();
            this._output.disconnect();
        } catch (e) { }
    }
}
