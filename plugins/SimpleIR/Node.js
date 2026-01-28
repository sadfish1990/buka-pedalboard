// SimpleIR Node - Pure Convolution Engine (Robust Connect/Disconnect)
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class SimpleIRNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;
        this._baseURL = options?.baseURL || '';

        // --- NODES ---
        this._input = context.createGain();
        this._output = context.createGain(); // Final Exit Point

        // Dry/Wet Path
        this._dryGain = context.createGain();
        this._wetGain = context.createGain();

        // Convolver
        this._convolver = context.createConvolver();
        this._convolver.normalize = false;

        // Initial Mix (100% DRY to prevent mute)
        this._dryGain.gain.value = 1.0;
        this._wetGain.gain.value = 0.0;

        // --- GRAPH ---
        // Input -> Dry -> Output
        this._input.connect(this._dryGain);
        this._dryGain.connect(this._output);

        // Input -> Convolver -> Wet -> Output
        this._input.connect(this._convolver);
        this._convolver.connect(this._wetGain);
        this._wetGain.connect(this._output);

        this._setSilentBuffer();

        // CRITICAL WIRING: Connect 'this' (Plugin Input) to internal _input
        // We use the prototype connect to bypass our own override below
        AudioNode.prototype.connect.call(this, this._input);
    }

    _setSilentBuffer() {
        const buf = this._context.createBuffer(2, 1, this._context.sampleRate);
        this._convolver.buffer = buf;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
        // Auto-load default
        this.loadImpulse('cabinet/Marshall1960.wav');
    }

    // SAFE OVERRIDES: Use rest args to handle all connect/disconnect signatures
    connect(...args) {
        return this._output.connect(...args);
    }

    disconnect(...args) {
        return this._output.disconnect(...args);
    }

    async loadImpulse(url) {
        try {
            const fullUrl = `${this._baseURL}/assets/impulses/${url}`;
            const response = await fetch(fullUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this._context.decodeAudioData(arrayBuffer);
            this._convolver.buffer = audioBuffer;
            console.log(`SimpleIR: Loaded ${url}`);
        } catch (e) {
            console.error(`SimpleIR: Failed to load ${url}`, e);
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        const val = parseFloat(value);

        if (name === 'mix') {
            // 0 = Dry, 10 = Wet (Linear for simplicity/safety)
            const mix = val / 10;
            this._dryGain.gain.value = 1.0 - mix;
            this._wetGain.gain.value = mix;
        }

        if (name === 'level') {
            this._output.gain.value = val / 10;
        }
    }

    destroy() {
        super.destroy();
        try {
            this._input.disconnect();
            this._output.disconnect();
            this._convolver.disconnect();
        } catch (e) {
            // Ignore errors on destroy
        }
    }
}
