// OrangeDistortion Node - Boss DS-1 Clone
import CompositeAudioNode from "../utils/sdk-parammgr/src/CompositeAudioNode.js";

export default class OrangeDistortionNode extends CompositeAudioNode {
    constructor(context, options) {
        super(context, options);
        this._context = context;

        // Create nodes
        this._input = context.createGain();
        this._output = context.createGain();

        // Distortion gain
        this._distGain = context.createGain();
        this._distGain.gain.value = 1.0;

        // Asymmetric clipper (DS-1 uses asymmetric diode clipping)
        this._clipper = context.createWaveShaper();
        this._clipper.curve = this._makeAsymmetricClipCurve();
        this._clipper.oversample = '4x';

        // Tone control (active mid-scoop)
        // DS-1 tone is a bit complex - it scoops mids and boosts highs
        this._lowShelf = context.createBiquadFilter();
        this._lowShelf.type = 'lowshelf';
        this._lowShelf.frequency.value = 200;
        this._lowShelf.gain.value = 0;

        this._midCut = context.createBiquadFilter();
        this._midCut.type = 'peaking';
        this._midCut.frequency.value = 800;
        this._midCut.Q.value = 1.0;
        this._midCut.gain.value = 0;

        this._highShelf = context.createBiquadFilter();
        this._highShelf.type = 'highshelf';
        this._highShelf.frequency.value = 3000;
        this._highShelf.gain.value = 0;

        // Output level
        this._levelGain = context.createGain();
        this._levelGain.gain.value = 1.0;

        // Routing: Input -> DistGain -> Clipper -> Tone Stack -> Level -> Output
        this._input.connect(this._distGain);
        this._distGain.connect(this._clipper);
        this._clipper.connect(this._lowShelf);
        this._lowShelf.connect(this._midCut);
        this._midCut.connect(this._highShelf);
        this._highShelf.connect(this._levelGain);
        this._levelGain.connect(this._output);

        // Bypass routing
        this._bypassGain = context.createGain();
        this._bypassGain.gain.value = 0; // Muted initially
        this._input.connect(this._bypassGain);
        this._bypassGain.connect(this._output);

        // Wire CompositeAudioNode
        AudioNode.prototype.connect.call(this, this._input);
    }

    _makeAsymmetricClipCurve() {
        // Asymmetric clipping (DS-1 characteristic)
        const samples = 2048;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;

            // Asymmetric soft clip
            if (x > 0) {
                curve[i] = Math.tanh(x * 2.5) * 0.8;
            } else {
                curve[i] = Math.tanh(x * 3.5) * 0.7;
            }
        }

        return curve;
    }

    setup(paramMgr) {
        this._wamNode = paramMgr;
    }

    setBypass(bypassed) {
        if (bypassed) {
            // Mute effect, enable bypass
            this._levelGain.gain.value = 0;
            this._bypassGain.gain.value = 1;
        } else {
            // Restore effect, mute bypass
            this._bypassGain.gain.value = 0;
            this._levelGain.gain.value = this._savedLevel || 1.0;
        }
    }

    setParamValue(name, value) {
        this._wamNode?.setParamValue(name, value);

        switch (name) {
            case 'tone':
                // Tone: 0 = dark (scooped), 1 = bright (boosted highs)
                // At 0: boost lows, cut mids, neutral highs
                // At 1: neutral lows, cut mids, boost highs
                const tonePos = value;

                this._lowShelf.gain.value = (1 - tonePos) * 6; // 0-6dB boost at CCW
                this._midCut.gain.value = -8; // Always cut mids (DS-1 signature)
                this._highShelf.gain.value = tonePos * 10; // 0-10dB boost at CW
                break;
            case 'level':
                // Level: 0.1x to 2x
                const level = 0.1 + (value * 1.9);
                this._levelGain.gain.value = level;
                this._savedLevel = level; // Save for bypass
                break;
            case 'distortion':
                // Distortion: 1x to 50x gain
                this._distGain.gain.value = 1 + (value * 49);
                break;
        }
    }

    connect(...args) { return this._output.connect(...args); }
    disconnect(...args) { return this._output.disconnect(...args); }

    destroy() {
        super.destroy();
        this._input.disconnect();
        this._output.disconnect();
    }
}
