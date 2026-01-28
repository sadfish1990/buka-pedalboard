// LiveTuner GUI & Pitch Detection Engine
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        background: #000;
        color: #fff;
        font-family: 'Arial', sans-serif;
        border-radius: 8px;
        width: 200px;
        border: 4px solid #333;
        box-shadow: 0 4px 12px rgba(0,0,0,0.8);
    `;

    // Screen
    const screen = document.createElement('div');
    screen.style.cssText = `
        width: 100%;
        height: 100px;
        background: #111;
        border: 2px solid #444;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
        position: relative;
        overflow: hidden;
    `;

    // Note Display
    const noteDisplay = document.createElement('div');
    noteDisplay.textContent = "--";
    noteDisplay.style.cssText = "font-size: 48px; font-weight: bold; color: #444; text-shadow: 0 0 5px rgba(255,255,255,0.1);";

    // Meter Bar
    const meterContainer = document.createElement('div');
    meterContainer.style.cssText = "width: 80%; height: 6px; background: #222; border-radius: 3px; margin-top: 10px; position: relative;";

    const meterIndicator = document.createElement('div');
    meterIndicator.style.cssText = "width: 4px; height: 10px; background: #fff; position: absolute; top: -2px; left: 50%; border-radius: 2px; transition: background 0.1s;";
    meterContainer.appendChild(meterIndicator);

    // Cent Deviation Display
    const centsDisplay = document.createElement('div');
    centsDisplay.style.cssText = "font-size: 10px; color: #666; margin-top: 5px;";
    centsDisplay.textContent = "0 cents";

    screen.appendChild(noteDisplay);
    screen.appendChild(meterContainer);
    screen.appendChild(centsDisplay);
    container.appendChild(screen);

    // Mute Button
    const muteBtn = document.createElement('button');
    muteBtn.textContent = "MUTE";
    muteBtn.style.cssText = `
        background: #333;
        color: #fff;
        border: 1px solid #555;
        padding: 5px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    let isMuted = false;
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMuted = !isMuted;
        muteBtn.style.background = isMuted ? '#f00' : '#333';
        muteBtn.textContent = isMuted ? 'MUTED' : 'MUTE';
        plugin.audioNode.setParamValue('bypass', isMuted ? 1 : 0);
    });

    container.appendChild(muteBtn);

    // --- PITCH DETECTION ENGINE ---
    const analyser = plugin.audioNode.getAnalyser();
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    const sampleRate = plugin.audioContext.sampleRate;

    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    function autoCorrelate(buf, sampleRate) {
        let SIZE = buf.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return -1; // Too quiet

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++)
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++)
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        const c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++)
            for (let j = 0; j < SIZE - i; j++)
                c[i] = c[i] + buf[j] * buf[j + i];

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    function noteFromPitch(frequency) {
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    function frequencyFromNoteNumber(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function centsOffFromPitch(frequency, note) {
        return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
    }

    let rafId;

    function updatePitch() {
        analyser.getFloatTimeDomainData(buffer);
        const ac = autoCorrelate(buffer, sampleRate);

        if (ac === -1) {
            noteDisplay.style.color = "#444"; // Dim
            meterIndicator.style.display = 'none';
        } else {
            const note = noteFromPitch(ac);
            const sym = noteStrings[note % 12];
            const cents = centsOffFromPitch(ac, note);

            noteDisplay.textContent = sym;
            centsDisplay.textContent = `${cents > 0 ? '+' : ''}${cents} ct`;

            // Visual Feedback
            // Green if within +/- 5 cents
            const isInTune = Math.abs(cents) < 5;
            noteDisplay.style.color = isInTune ? "#0f0" : "#fff";

            // Meter movement
            // Range: -50 to +50 cents maps to 0% to 100% left
            let pos = 50 + cents;
            pos = Math.max(0, Math.min(100, pos));

            meterIndicator.style.display = 'block';
            meterIndicator.style.left = `${pos}%`;
            meterIndicator.style.background = isInTune ? '#0f0' : '#f00';
        }

        rafId = window.requestAnimationFrame(updatePitch);
    }

    // Start loop
    updatePitch();

    // Cleanup on remove? Not standard in WAM API but GUI element removal might happen
    // Ideally we attach a disconnect observer but for now loop runs (low CPU cost if hidden) or is killed by GC if plugin destroyed (closure)

    return container;
}
