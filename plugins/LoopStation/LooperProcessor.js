// LoopStation Processor - 4-Track Sync Looper
// States: 0=Empty, 1=Recording, 2=Playing, 3=Overdubbing, 4=Stopped
class LooperProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this._tracks = [
            { buffer: null, state: 0, recPos: 0, playPos: 0, gain: 1.0, pan: 0 },
            { buffer: null, state: 0, recPos: 0, playPos: 0, gain: 1.0, pan: 0 },
            { buffer: null, state: 0, recPos: 0, playPos: 0, gain: 1.0, pan: 0 },
            { buffer: null, state: 0, recPos: 0, playPos: 0, gain: 1.0, pan: 0 }
        ];

        this._masterLength = 0; // Length in samples (Track 1 defines this)
        this._globalState = 'stop'; // 'play' or 'stop'
        this._metronome = false;

        this.port.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'transport') {
                this._handleTransport(data.track, data.action);
            } else if (type === 'mixer') {
                const trk = this._tracks[data.track];
                if (trk) {
                    if (data.gain !== undefined) trk.gain = data.gain;
                    if (data.pan !== undefined) trk.pan = data.pan;
                }
            } else if (type === 'global') {
                if (data.action === 'play') this._globalState = 'play';
                if (data.action === 'stop') this._globalState = 'stop'; // Reset pos?
            }
        };
    }

    _handleTransport(idx, action) {
        const trk = this._tracks[idx];
        if (!trk) return;

        switch (action) {
            case 'rec':
                // sync start if master exists
                trk.state = (trk.state === 0 || trk.state === 4) ? 1 : 3; // 1=Rec, 3=Overdub checking handled in process
                if (idx === 0 && this._masterLength === 0) {
                    // First Loop Start
                    trk.state = 1;
                    trk.recPos = 0;
                    this._globalState = 'play';
                } else if (this._masterLength > 0) {
                    // Sync Rec
                    trk.state = 3; // Overdub logic effectively for sync
                    // Align playPos to master?
                }
                break;
            case 'play':
                trk.state = 2; // Play
                break;
            case 'stop':
                trk.state = 4; // Stop
                break;
            case 'clear':
                trk.buffer = null;
                trk.state = 0;
                trk.recPos = 0;
                trk.playPos = 0;
                if (idx === 0) this._masterLength = 0;
                break;
        }
        this.port.postMessage({ type: 'state', track: idx, state: trk.state });
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        // If no mic input, silence? Assuming input[0] exists
        const inL = input[0] || new Float32Array(128);
        // Stereo Input optional, let's assume mono input mapped to stereo loop
        // Or pure stereo. Let's do mono input -> stereo output/buffer for simplicity or true stereo.
        // Let's implement Stereo buffers.

        const inR = input[1] || inL;
        const outL = output[0];
        const outR = output[1]; // Stereo output

        const frames = outL.length;

        // Global Stop?
        if (this._globalState === 'stop') return true;

        for (let i = 0; i < frames; i++) {
            let mixL = 0;
            let mixR = 0;

            // Pass through input? (Monitoring). Usually standard in Loopers.
            const sL = inL[i];
            const sR = inR[i];
            mixL += sL * 0.7;
            mixR += sR * 0.7;

            // Process Tracks
            for (let t = 0; t < 4; t++) {
                const trk = this._tracks[t];

                // Track 1 Master Logic
                if (t === 0) {
                    if (trk.state === 1) { // Recording Master
                        if (!trk.buffer) { trk.buffer = [new Float32Array(48000 * 60), new Float32Array(48000 * 60)]; } // Max 60s
                        // Expand if needed? Fixed max for now
                        trk.buffer[0][trk.recPos] = sL;
                        trk.buffer[1][trk.recPos] = sR;
                        trk.recPos++;
                    } else if (trk.state === 2 || trk.state === 3) { // Play or Overdub
                        if (this._masterLength === 0 && trk.recPos > 0) this._masterLength = trk.recPos; // Did we just finish rec?

                        // Play
                        if (trk.playPos >= this._masterLength) trk.playPos = 0;

                        const bufL = trk.buffer[0][trk.playPos];
                        const bufR = trk.buffer[1][trk.playPos];

                        mixL += bufL * trk.gain;
                        mixR += bufR * trk.gain;

                        // Overdub
                        if (trk.state === 3) {
                            trk.buffer[0][trk.playPos] += sL;
                            trk.buffer[1][trk.playPos] += sR;
                        }

                        trk.playPos++;
                    }
                } else {
                    // Follower Tracks (2, 3, 4)
                    // They sync position to Track 1's cycle

                    // If Master Empty, they can't do anything usually or they become master?
                    // Simple logic: Track 1 is King.
                    if (this._masterLength > 0) {
                        const masterPos = this._tracks[0].playPos;
                        // Actually, we must maintain own PlayPos aligned to Master.
                        // But simplification: All tracks share 'phase' of master loop?
                        // Yes, typical loop station.

                        const pos = (masterPos - 1 + frames) % this._masterLength; // Align roughly
                        // Let's use master's current pointer for playback

                        // Wait, we are in a loop i 0..128
                        // Master is incrementing trk.playPos at index i.
                        // We can just look at Track 0's pointer (it was just incremented or about to be).
                        // Let's use a shared relative pointer.

                        let pointer = this._tracks[0].playPos; // This frame's pointer
                        // Careful with order of operations. T=0 processed first. 
                        // So pointer is valid for this sample step.

                        if (trk.state === 3) { // Rec/Overdub
                            if (!trk.buffer) {
                                trk.buffer = [new Float32Array(this._masterLength), new Float32Array(this._masterLength)];
                            }
                            trk.buffer[0][pointer] += sL;
                            trk.buffer[1][pointer] += sR;
                        }

                        if (trk.state === 2 || trk.state === 3) { // Play
                            if (trk.buffer) {
                                // Wrap check handled by master length constraint
                                if (pointer < trk.buffer[0].length) {
                                    mixL += trk.buffer[0][pointer] * trk.gain;
                                    mixR += trk.buffer[1][pointer] * trk.gain;
                                }
                            }
                        }
                    }
                }
            } // end tracks

            // Output
            outL[i] = mixL;
            if (outR) outR[i] = mixR;
        } // end frames

        // Finalize state transitions (Rec -> Play) if commanded?
        // Logic handled in message port mostly.
        // Auto-close Master Loop: handled by receiving 'Play' command from GUI while recording.

        return true;
    }
}

registerProcessor('looper-processor', LooperProcessor);
