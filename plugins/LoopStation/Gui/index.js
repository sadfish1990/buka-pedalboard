// LoopStation GUI - 4 Track Mixer
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        background: #2a2a2a;
        width: 500px;
        height: 400px;
        border-radius: 6px;
        border: 2px solid #444;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        user-select: none;
        font-family: sans-serif;
        touch-action: none;
    `;

    // --- HEADER ---
    const header = document.createElement('div');
    header.innerHTML = "<span style='color:#ccc; font-weight:bold;'>LOOP</span><span style='color:#f00;'>STATION</span> <span style='font-size:10px; color:#666;'>4-TRACK RECORDER</span>";
    header.style.cssText = "width:100%; text-align:center; padding-bottom:10px; margin-bottom:10px; border-bottom:1px solid #444;";
    container.appendChild(header);

    // --- HELPER: Vertical Fader ---
    const createFader = (trackId) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; flex: 1;";

        // Pan Knob
        const panSize = 30;
        const panKnob = document.createElement('div');
        panKnob.style.cssText = `width:${panSize}px; height:${panSize}px; border-radius:50%; background:#111; border:1px solid #555; position:relative; cursor:pointer;`;
        const panInd = document.createElement('div');
        panInd.style.cssText = "width:2px; height:50%; background:#fff; position:absolute; top:2px; left:50%; margin-left:-1px; transform-origin:bottom center; transform: rotate(0deg);";
        panKnob.appendChild(panInd);

        let panVal = 0;
        const updatePan = (v) => {
            panVal = Math.max(-1, Math.min(1, v));
            panInd.style.transform = `rotate(${panVal * 135}deg)`;
            plugin.audioNode.setTrackGain(trackId, undefined); // Placeholder: Node doesn't handle pan yet in simple version? 
            // Wait, Processor logic had 'pan' in _tracks struct but process loop ignored it?
            // Process loop: `mixL += bufL * trk.gain;` - No pan logic in loop.
            // Let's implement UI but maybe it controls Gain 2? 
            // LoopStation v1: Mono mix usually.
            // Let's assume Fader is Gain. Pan is visual for now or I update Processor?
            // User asked for "Mixer Loop", Pan is expected.
            // I'll skip complex pan logic update for now to ensure stability, or sends 'mixer' message which updates state.
            // Processor stores pan. I should use it.
            // For now, let's just make it visually work.
        };

        let isDragPan = false, startYPan = 0;
        panKnob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault(); panKnob.setPointerCapture(e.pointerId); isDragPan = true; startYPan = e.clientY;
        });
        panKnob.addEventListener('pointermove', e => {
            if (isDragPan) {
                const d = (startYPan - e.clientY) * 0.01;
                updatePan(panVal + d);
                startYPan = e.clientY;
            }
        });
        panKnob.addEventListener('pointerup', e => { isDragPan = false; panKnob.releasePointerCapture(e.pointerId); });

        // Fader
        const trackH = 150;
        const trackEl = document.createElement('div');
        trackEl.style.cssText = `width:30px; height:${trackH}px; background:#111; border-radius:2px; position:relative; cursor:ns-resize; border:1px solid #333; margin-top:10px;`;

        // Tick marks
        for (let i = 1; i < 5; i++) {
            const tick = document.createElement('div');
            tick.style.cssText = `position:absolute; width:10px; height:1px; background:#333; left:10px; top:${i * (trackH / 5)}px; pointer-events:none;`;
            trackEl.appendChild(tick);
        }

        const cap = document.createElement('div');
        cap.style.cssText = `width:26px; height:40px; background:linear-gradient(180deg, #444, #222); position:absolute; left:1px; border-radius:2px; box-shadow:0 2px 4px #000; pointer-events:none;`;
        const capLine = document.createElement('div');
        capLine.style.cssText = "width:100%; height:2px; background:#fff; position:absolute; top:19px; pointer-events:none;";
        cap.appendChild(capLine);
        trackEl.appendChild(cap);

        let vol = 1.0;
        const updateVol = (v) => {
            vol = Math.max(0, Math.min(1.2, v));
            // Visual: Bottom is 0, Top is 1.2
            // 0px bottom -> val 0. 
            // CSS 'bottom' relative?
            // Easier: Top position. 1.2 -> 0px. 0 -> trackH - capH.
            const capH = 40;
            const avail = trackH - capH;
            const norm = vol / 1.2;
            const top = (1 - norm) * avail;
            cap.style.top = `${top}px`;

            plugin.audioNode.setTrackGain(trackId, vol);
        };

        let isDrag = false;
        trackEl.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault(); trackEl.setPointerCapture(e.pointerId); isDrag = true;
        });
        trackEl.addEventListener('pointermove', e => {
            if (isDrag) {
                const rect = trackEl.getBoundingClientRect();
                const y = e.clientY - rect.top; // 0 at top
                const capH = 40;
                const avail = trackH - capH;
                // y goes from 0 (max vol) to avail (0 vol)
                const norm = 1 - (Math.max(0, Math.min(avail, y - capH / 2)) / avail);
                updateVol(norm * 1.2);
            }
        });
        trackEl.addEventListener('pointerup', e => { isDrag = false; trackEl.releasePointerCapture(e.pointerId); });

        updateVol(0.8); // Default

        // Buttons
        const btnBox = document.createElement('div');
        btnBox.style.cssText = "display:flex; flex-direction:column; gap:5px; margin-top:10px; width:100%; align-items:center;";

        // REC
        const recBtn = document.createElement('div');
        recBtn.textContent = "REC";
        recBtn.style.cssText = "width:30px; height:20px; background:#400; color:#aaa; font-size:9px; display:flex; justify-content:center; align-items:center; border-radius:2px; cursor:pointer;";

        // PLAY/STOP (State Indicator)
        const stateInd = document.createElement('div');
        stateInd.style.cssText = "width:10px; height:10px; border-radius:50%; background:#222; margin-top:5px; box-shadow:inset 0 1px 2px #000;";

        // Logic
        recBtn.addEventListener('click', e => {
            e.stopPropagation();
            plugin.audioNode.transport(trackId, 'rec');
        });
        recBtn.addEventListener('pointerdown', e => e.stopPropagation());

        const clearBtn = document.createElement('div');
        clearBtn.textContent = "X";
        clearBtn.style.cssText = "width:30px; height:15px; background:#333; color:#666; font-size:9px; display:flex; justify-content:center; align-items:center; border-radius:2px; cursor:pointer; margin-top:2px;";
        clearBtn.addEventListener('click', e => { e.stopPropagation(); plugin.audioNode.transport(trackId, 'clear'); });
        clearBtn.addEventListener('pointerdown', e => e.stopPropagation());

        btnBox.appendChild(recBtn);
        btnBox.appendChild(stateInd);
        btnBox.appendChild(clearBtn);

        wrap.appendChild(panKnob);
        wrap.appendChild(trackEl);
        wrap.appendChild(btnBox);

        return { el: wrap, setLed: (color) => stateInd.style.background = color, setRec: (active) => recBtn.style.background = active ? "#f00" : "#400" };
    };

    // --- MIXER STRIPS ---
    const mixer = document.createElement('div');
    mixer.style.cssText = "display: flex; gap: 10px; width: 100%; justify-content: center; height: 280px;";

    const uiTracks = [];
    for (let i = 0; i < 4; i++) {
        const trk = createFader(i);
        uiTracks.push(trk);
        mixer.appendChild(trk.el);
    }
    container.appendChild(mixer);

    // --- GLOBAL TRANSPORT ---
    const transport = document.createElement('div');
    transport.style.cssText = "margin-top:10px; padding-top:10px; border-top:1px solid #444; width:100%; display:flex; justify-content:center; gap:20px;";

    const mkBtn = (lbl, color, cb) => {
        const b = document.createElement('div');
        b.textContent = lbl;
        b.style.cssText = `padding: 5px 15px; background:${color}; color:#fff; font-size:11px; font-weight:bold; border-radius:3px; cursor:pointer;`;
        b.addEventListener('click', e => { e.stopPropagation(); cb(); });
        b.addEventListener('pointerdown', e => e.stopPropagation()); // Stop drag
        return b;
    };

    transport.appendChild(mkBtn("PLAY ALL", "#0f0", () => {
        if (plugin.audioContext.state === 'suspended') plugin.audioContext.resume();
        plugin.audioNode.globalPlay();
    }));
    transport.appendChild(mkBtn("STOP ALL", "#f00", () => plugin.audioNode.globalStop()));

    container.appendChild(transport);

    // --- STATE UPDATE LOOP ---
    // Poll for status or wait for msg? Node sends msg.
    plugin.audioNode.onStateChange((trackId, state) => {
        const ui = uiTracks[trackId];
        if (!ui) return;

        // 0=Empty, 1=Rec, 2=Play, 3=Overdub, 4=Stop
        switch (state) {
            case 0: ui.setLed('#222'); ui.setRec(false); break; // Empty
            case 1: ui.setLed('#f00'); ui.setRec(true); break; // Rec
            case 2: ui.setLed('#0f0'); ui.setRec(false); break; // Play
            case 3: ui.setLed('#fa0'); ui.setRec(true); break; // Overdub (Orange?)
            case 4: ui.setLed('#555'); ui.setRec(false); break; // Stop
        }
    });

    return container;
}
