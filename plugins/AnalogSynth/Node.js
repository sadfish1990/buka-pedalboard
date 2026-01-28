// AcidSynth Node - Mono Manager
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";
import Voice from "./Voice.js";

export default class AcidSynthNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;
        this._output = context.createGain();

        // Single Voice (Mono)
        this._voice = new Voice(context, this._output);

        this._params = {
            wave: 'sawtooth',
            tuning: 0,
            cutoff: 400, res: 5, envMod: 1000,
            decay: 0.2, accent: 0.5
        };
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    noteOn(note) {
        const time = this._context.currentTime;
        this._voice.triggerAttack(note, time, 1.0);
    }

    noteOff(note) {
        const time = this._context.currentTime;
        if (this._voice.note === note) {
            this._voice.triggerRelease(time);
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'tuning': this._params.tuning = value; break;
            case 'cutoff': this._params.cutoff = value; break;
            case 'res': this._params.res = value; break;
            case 'envMod': this._params.envMod = value; break;
            case 'decay': this._params.decay = value; break;
            case 'accent': this._params.accent = value; break;
            case 'wave':
                this._params.wave = value > 0.5 ? 'square' : 'sawtooth';
                break;
        }
        this._voice.setParams(this._params);
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }
    destroy() { super.destroy(); this._output.disconnect(); }
}
