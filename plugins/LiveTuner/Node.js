// LiveTuner Node - Pass-through with Analysis
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class LiveTunerNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // 1. Nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // 2. Analyser (High resolution for tuner)
        this._analyser = context.createAnalyser();
        this._analyser.fftSize = 2048; // Buffer size for time domain

        // 3. Bypass Gain (Mute while tuning option)
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 1.0;

        // 4. Graph
        // Input -> Analyser (Sidechain)
        this._input.connect(this._analyser);

        // Input -> BypassGain -> Output (Thru)
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Wiring
        AudioNode.prototype.connect.call(this, this._input);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    // Expose Analyser to GUI
    getAnalyser() {
        return this._analyser;
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        if (name === 'bypass') {
            // If bypass (tuning mode) is ON (1), we mute the output
            // If bypass is OFF (0), we let sound thru
            const val = parseFloat(value);
            this._bypassGain.gain.setTargetAtTime(val > 0.5 ? 0 : 1, this._context.currentTime, 0.05);
        }
    }

    destroy() {
        super.destroy();
        this._input.disconnect();
        this._output.disconnect();
        this._analyser.disconnect();
    }
}
