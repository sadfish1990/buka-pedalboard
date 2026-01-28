// LoopStation Entry
import WebAudioModule from "../utils/sdk/src/WebAudioModule.js";
import ParamMgrFactory from "../utils/sdk-parammgr/src/ParamMgrFactory.js";
import LoopNode from "./LoopNode.js";
import createElement from "./Gui/index.js";

const getBaseUrl = (relativeURL) => {
    const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf("/"));
    return baseURL;
};

export default class LoopStationPlugin extends WebAudioModule {
    _baseURL = getBaseUrl(new URL(".", import.meta.url));
    _descriptorUrl = `${this._baseURL}/descriptor.json`;

    async initialize(state) {
        await this._loadDescriptor();
        await this.audioContext.audioWorklet.addModule(`${this._baseURL}/LooperProcessor.js`);
        return super.initialize(state);
    }

    async _loadDescriptor() {
        const res = await fetch(this._descriptorUrl);
        const desc = await res.json();
        Object.assign(this.descriptor, desc);
    }

    async createAudioNode(initialState) {
        const node = new LoopNode(this.audioContext, { baseURL: this._baseURL });

        // No Automatable Params needed for version 1, but factory required
        const paramMgr = await ParamMgrFactory.create(this, {
            internalParamsConfig: {}
        });

        node.setup(paramMgr);

        // Expose input for connections
        // Composite Node wiring hack for WAM host compatibility
        // Ensure host connects to node._input
        node.input = node._input;

        return node;
    }

    createGui() {
        return createElement(this);
    }
}
