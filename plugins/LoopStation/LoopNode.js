// LoopNode - Bridge
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class LoopNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);

        this._worklet = new AudioWorkletNode(context, 'looper-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });

        this._input = context.createGain(); // Input Node
        this._output = context.createGain();

        this._input.connect(this._worklet);
        this._worklet.connect(this._output);
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    // API
    transport(track, action) {
        // action: 'rec', 'play', 'stop', 'clear'
        this._worklet.port.postMessage({ type: 'transport', data: { track, action } });
    }

    setTrackGain(track, gain) {
        this._worklet.port.postMessage({ type: 'mixer', data: { track, gain } });
    }

    globalPlay() { this._worklet.port.postMessage({ type: 'global', data: { action: 'play' } }); }
    globalStop() { this._worklet.port.postMessage({ type: 'global', data: { action: 'stop' } }); }

    onStateChange(callback) {
        this._worklet.port.onmessage = (e) => {
            if (e.data.type === 'state') callback(e.data.track, e.data.state);
        };
    }

    // Connect both Input and Output
    // WAM SDK usually handles output via connect vs input via process
    // We need to expose input for the host to route audio TO us
    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    // Custom input accessor if WAM 2.0 host asks?
    // Usually host connects to `.input` property if defined? 
    // Standard WAM uses CompositeAudioNode input.
}
