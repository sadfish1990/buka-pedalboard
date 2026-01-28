// MetalX Entry Point
import WebAudioModule from "../utils/sdk/src/WebAudioModule.js";
import ParamMgrFactory from "../utils/sdk-parammgr/src/ParamMgrFactory.js";
import MetalXNode from "./Node.js";
import createElement from "./Gui/index.js";

const getBaseUrl = (relativeURL) => {
    const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf("/"));
    return baseURL;
};

export default class MetalXPlugin extends WebAudioModule {
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
        const node = new MetalXNode(this.audioContext, { baseURL: this._baseURL });

        const paramMgr = await ParamMgrFactory.create(this, {
            internalParamsConfig: {
                vol: { defaultValue: 5, minValue: 0, maxValue: 10 },
                freq: { defaultValue: 5, minValue: 0, maxValue: 10 }, // Mid Freq
                gain: { defaultValue: 8, minValue: 0, maxValue: 10 },
                low: { defaultValue: 5, minValue: 0, maxValue: 10 },
                mid: { defaultValue: 5, minValue: 0, maxValue: 10 }, // Mid Gain
                high: { defaultValue: 5, minValue: 0, maxValue: 10 },
                gate: { defaultValue: 0, minValue: 0, maxValue: 10 }, // Gate Thresh
                scoop: { defaultValue: 0, minValue: 0, maxValue: 1 }  // Switch
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
