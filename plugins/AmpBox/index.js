// AmpBox Entry Point
import WebAudioModule from "../utils/sdk/src/WebAudioModule.js";
import ParamMgrFactory from "../utils/sdk-parammgr/src/ParamMgrFactory.js";
import AmpBoxNode from "./Node.js";
import createElement from "./Gui/index.js";

const getBaseUrl = (relativeURL) => {
    const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf("/"));
    return baseURL;
};

export default class AmpBoxPlugin extends WebAudioModule {
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
        const node = new AmpBoxNode(this.audioContext, { baseURL: this._baseURL });

        const paramMgr = await ParamMgrFactory.create(this, {
            internalParamsConfig: {
                level: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                high: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                low: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                drive: { defaultValue: 0.5, minValue: 0, maxValue: 1 },
                mic: { defaultValue: 0.5, minValue: 0, maxValue: 1 }, // Switch
                mod: { defaultValue: 0.5, minValue: 0, maxValue: 1 }, // Switch
                amp: { defaultValue: 0.5, minValue: 0, maxValue: 1 }  // Switch
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
