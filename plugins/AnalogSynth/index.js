// AcidSynth Entry Point
import WebAudioModule from "../utils/sdk/src/WebAudioModule.js";
import ParamMgrFactory from "../utils/sdk-parammgr/src/ParamMgrFactory.js";
import AcidSynthNode from "./Node.js";
import createElement from "./Gui/index.js";

const getBaseUrl = (relativeURL) => {
    const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf("/"));
    return baseURL;
};

export default class AcidSynthPlugin extends WebAudioModule {
    _baseURL = getBaseUrl(new URL(".", import.meta.url));
    _descriptorUrl = `${this._baseURL}/descriptor.json`;

    async initialize(state) {
        await this._loadDescriptor();
        return super.initialize(state);
    }

    async _loadDescriptor() {
        const res = await fetch(this._descriptorUrl);
        const desc = await res.json();
        Object.assign(this.descriptor, desc);
    }

    async createAudioNode(initialState) {
        const node = new AcidSynthNode(this.audioContext, { baseURL: this._baseURL });

        const paramMgr = await ParamMgrFactory.create(this, {
            internalParamsConfig: {
                tuning: { defaultValue: 0, minValue: -1200, maxValue: 1200 },
                cutoff: { defaultValue: 400, minValue: 20, maxValue: 5000 },
                res: { defaultValue: 5, minValue: 0, maxValue: 30 }, // High Res for Acid
                envMod: { defaultValue: 1000, minValue: 0, maxValue: 5000 },
                decay: { defaultValue: 0.2, minValue: 0.05, maxValue: 2.0 },
                accent: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                wave: { defaultValue: 0, minValue: 0, maxValue: 1 } // 0=Saw, 1=Sqr
            }
        });

        node.setup(paramMgr);
        if (initialState) node.setState(initialState);
        return node;
    }

    createGui() {
        return createElement(this);
    }
}
