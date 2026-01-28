// Drummer Node - Bridge to Worklet V2
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class DrummerNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;
        this._baseURL = options?.baseURL || '';

        this._worklet = new AudioWorkletNode(context, 'drummer-processor', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });

        this._output = context.createGain();
        this._worklet.connect(this._output);

        this._loadSamples();
    }

    async _loadSamples() {
        const load = async (name) => {
            const res = await fetch(`${this._baseURL}/assets/${name}.wav`);
            const buf = await res.arrayBuffer();
            const audioBuf = await this._context.decodeAudioData(buf);
            const data = audioBuf.getChannelData(0);
            this._worklet.port.postMessage({
                type: 'sample',
                data: { name: name, buffer: data }
            });
        };
        await Promise.all([load('kick'), load('snare'), load('hat')]);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    // API
    setPattern(instrument, step, val, section = null) {
        this._worklet.port.postMessage({
            type: 'pattern',
            data: { section: section, name: instrument, step: step, val: val }
        });
    }

    setTransport(isPlaying) {
        this._worklet.port.postMessage({ type: 'transport', data: isPlaying });
    }

    setSection(section) {
        this._worklet.port.postMessage({ type: 'section', data: section });
    }

    loadPreset(patterns) {
        // patterns = { kick:[], snare:[], hat:[] }
        this._worklet.port.postMessage({ type: 'set_all_patterns', data: patterns });
    }

    onStep(callback) {
        this._worklet.port.addEventListener('message', (e) => {
            if (e.data.type === 'step') callback(e.data.step);
        });
        this._worklet.port.start();
    }

    onPatternChange(callback) {
        this._worklet.port.addEventListener('message', (e) => {
            if (e.data.type === 'pattern_dump') callback(e.data.section, e.data.pattern);
        });
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        if (name === 'tempo') {
            this._worklet.port.postMessage({ type: 'bpm', data: value });
        }
        if (name === 'volume') {
            // Linear gain? or Log? 0-1 mapped directly safe.
            this._output.gain.value = value;
        }
    }

    destroy() {
        super.destroy();
        this._worklet.disconnect();
        this._output.disconnect();
    }
}
