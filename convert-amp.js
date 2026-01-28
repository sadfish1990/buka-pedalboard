#!/usr/bin/env node
// Automated Guitar Amp to WAM2 converter
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = '/tmp/guitar-amp/js';
const TARGET_DIR = '/home/buka/Documentos/wam2/plugins/GuitarAmpSim';

console.log('🎸 Guitar Amp to WAM2 Automated Converter');
console.log('==========================================\n');

// Step 1: Copy and convert amp.js
console.log('Step 1: Converting amp.js to ES6 module...');
let ampCode = fs.readFileSync(path.join(SOURCE_DIR, 'amp.js'), 'utf8');

// Remove global dependencies and DOM references
ampCode = ampCode.replace(/var audioPlayer.*?;/g, '// Removed: audioPlayer');
ampCode = ampCode.replace(/document\.querySelector/g, '// document.querySelector');
ampCode = ampCode.replace(/document\.getElementById/g, '// document.getElementById');

// Extract just the Amp class and its dependencies
const ampClassMatch = ampCode.match(/function Amp\(context\) \{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/);
const equalizerMatch = ampCode.match(/function Equalizer\(ctx\) \{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/);
const boostMatch = ampCode.match(/function Boost\(context\) \{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/);

if (!ampClassMatch) {
    console.error('❌ Could not find Amp class in source');
    process.exit(1);
}

// Create Node.js module
const nodeCode = `// Guitar Amp Audio Node
// Converted from original by Michel Buffa
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";
import WaveShapers from "./WaveShapers.js";

${boostMatch ? boostMatch[0] : ''}

${equalizerMatch ? equalizerMatch[0] : ''}

export default class GuitarAmpNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        
        this._context = context;
        this._wamNode = null;
        
        // Create the amp
        this._amp = this.createAmpInstance(context);
        
        // Connect to composite node
        this._input.connect(this._amp.input);
        this._amp.output.connect(this._output);
    }

    createAmpInstance(context) {
        ${ampClassMatch[0].replace('function Amp(context)', 'const amp = (function(context)')}
        
        return amp;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    getParamValue(name) {
        return this._wamNode?.getParamValue(name) || 0;
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);
        // Map parameters to amp controls
        // TODO: Implement parameter mapping
    }

    destroy() {
        super.destroy();
        // Cleanup
    }
}
`;

fs.writeFileSync(path.join(TARGET_DIR, 'Node.js'), nodeCode);
console.log('✅ Created Node.js\n');

// Step 2: Create index.js (main plugin)
console.log('Step 2: Creating index.js...');
const indexCode = `import WebAudioModule from "../utils/sdk/src/WebAudioModule.js";
import ParamMgrFactory from "../utils/sdk-parammgr/src/ParamMgrFactory.js";
import GuitarAmpNode from "./Node.js";
import createElement from "./Gui/index.js";

const getBaseUrl = (relativeURL) => {
    const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf("/"));
    return baseURL;
};

export default class GuitarAmpPlugin extends WebAudioModule {
    _baseURL = getBaseUrl(new URL(".", import.meta.url));
    _descriptorUrl = \`\${this._baseURL}/descriptor.json\`;

    async _loadDescriptor() {
        const response = await fetch(this._descriptorUrl);
        const descriptor = await response.json();
        Object.assign(this.descriptor, descriptor);
    }

    async initialize(state) {
        await this._loadDescriptor();
        return super.initialize(state);
    }

    async createAudioNode(initialState) {
        const node = new GuitarAmpNode(this.audioContext);
        
        const paramMgrNode = await ParamMgrFactory.create(this, {
            internalParamsConfig: {
                drive: { defaultValue: 4, minValue: 0, maxValue: 100 },
                bass: { defaultValue: 5, minValue: 0, maxValue: 10 },
                mid: { defaultValue: 5, minValue: 0, maxValue: 10 },
                treble: { defaultValue: 5, minValue: 0, maxValue: 10 },
                presence: { defaultValue: 5, minValue: 0, maxValue: 10 },
                volume: { defaultValue: 7, minValue: 0, maxValue: 10 }
            }
        });
        
        node.setup(paramMgrNode);
        
        if (initialState) node.setState(initialState);
        return node;
    }

    createGui() {
        return createElement(this);
    }
}
`;

fs.writeFileSync(path.join(TARGET_DIR, 'index.js'), indexCode);
console.log('✅ Created index.js\n');

// Step 3: Create simple GUI
console.log('Step 3: Creating GUI...');
const guiCode = `export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = \`
        display: flex;
        flex-direction: column;
        padding: 20px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: #f0f0f0;
        font-family: 'Arial', sans-serif;
        gap: 15px;
        border-radius: 8px;
        min-width: 300px;
    \`;

    const title = document.createElement('h3');
    title.textContent = '🎸 Guitar Amp Simulator';
    title.style.cssText = 'margin: 0; text-align: center; color: #ff6b35;';
    container.appendChild(title);

    const createKnob = (label, paramName, min, max, step = 0.1) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size: 12px; font-weight: bold; color: #ccc;';
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = plugin.audioNode.getParamValue(paramName);
        input.style.cssText = 'width: 100%;';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = input.value;
        valueDisplay.style.cssText = 'font-size: 11px; color: #888; text-align: right;';
        
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            plugin.audioNode.setParamValue(paramName, value);
            valueDisplay.textContent = value.toFixed(1);
        });
        
        wrapper.appendChild(labelEl);
        wrapper.appendChild(input);
        wrapper.appendChild(valueDisplay);
        
        return wrapper;
    };

    container.appendChild(createKnob('Drive', 'drive', 0, 100, 1));
    container.appendChild(createKnob('Bass', 'bass', 0, 10, 0.1));
    container.appendChild(createKnob('Mid', 'mid', 0, 10, 0.1));
    container.appendChild(createKnob('Treble', 'treble', 0, 10, 0.1));
    container.appendChild(createKnob('Presence', 'presence', 0, 10, 0.1));
    container.appendChild(createKnob('Volume', 'volume', 0, 10, 0.1));

    return container;
}
`;

fs.mkdirSync(path.join(TARGET_DIR, 'Gui'), { recursive: true });
fs.writeFileSync(path.join(TARGET_DIR, 'Gui/index.js'), guiCode);
console.log('✅ Created GUI\n');

console.log('✅ Conversion complete!');
console.log('\nNext steps:');
console.log('1. Add to wams.json');
console.log('2. Test locally');
console.log('3. Sync to Pi');
