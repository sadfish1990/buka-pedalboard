// MemoryBrigade Entry Point
import WebAudioModule from "../utils/sdk/src/WebAudioModule.js";
import ParamMgrFactory from "../utils/sdk-parammgr/src/ParamMgrFactory.js";
import MemoryBrigadeNode from "./Node.js";
import createElement from "./Gui/index.js";

const getBaseUrl = (relativeURL) => {
    const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf("/"));
    return baseURL;
};

export default class MemoryBrigadePlugin extends WebAudioModule {
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
        const node = new MemoryBrigadeNode(this.audioContext, { baseURL: this._baseURL });

        const paramMgr = await ParamMgrFactory.create(this, {
            internalParamsConfig: {
                level: { defaultValue: 0.8, minValue: 0, maxValue: 1 },
                blend: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                feedback: { defaultValue: 0.3, minValue: 0, maxValue: 1 },
                delay: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                depth: { defaultValue: 0.2, minValue: 0, maxValue: 1 },
                type: { defaultValue: 0, minValue: 0, maxValue: 2 } // 0=Chorus, 1=Off, 2=VIb
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
