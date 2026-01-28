// AcidSynth GUI - The Silver Box (Fixed Events)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #c0c0c0; /* Silver */
        width: 550px;
        height: 380px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        user-select: none;
        position: relative;
        touch-action: none;
        border: 2px solid #999;
    `;

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = "<span style='font-family:sans-serif; font-weight:bold; font-size:24px; color:#333; letter-spacing:2px;'>BASS LINE</span> <span style='font-size:12px; color:#555;'>TB-3030</span>";
    logo.style.cssText = "width:100%; border-bottom: 2px solid #555; padding-bottom: 5px; margin-bottom: 20px;";
    container.appendChild(logo);

    // Black Panel Area
    const panel = document.createElement('div');
    panel.style.cssText = `
        width: 100%; height: 160px; background: #222; border-radius: 4px; border: 2px solid #000;
        display: flex; gap: 20px; justify-content: center; align-items: center; padding: 0 20px; box-sizing: border-box;
    `;

    // Helper: Big 303 Knob
    const createKnob = (label, param, min, max, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";
        const lbl = document.createElement('div');
        lbl.textContent = label; lbl.style.cssText = "font-size:10px; color:#fff; font-family:sans-serif; font-weight:bold;";

        const knob = document.createElement('div');
        knob.style.cssText = "width:50px; height:50px; border-radius:50%; background:#111; border:2px solid #444; position:relative; cursor:pointer;";
        // Fluted sides visual (simple dashed border?)
        knob.style.boxShadow = "0 5px 10px rgba(0,0,0,0.8)";

        const ind = document.createElement('div');
        ind.style.cssText = "width:4px; height:50%; background:#fff; position:absolute; top:4px; left:50%; margin-left:-2px; transform-origin:bottom center; border-radius:2px;";
        knob.appendChild(ind);

        let val = def;
        const update = (v) => {
            const norm = (v - min) / (max - min);
            const deg = -135 + (norm * 270);
            ind.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, v);
        };

        let isDrag = false, startY = 0;
        const process = (e) => {
            e.stopPropagation();
            const delta = (startY - e.clientY) * ((max - min) / 150); // Slower
            val = Math.min(max, Math.max(min, val + delta));
            update(val);
            startY = e.clientY;
        };

        knob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            knob.setPointerCapture(e.pointerId); isDrag = true; startY = e.clientY;
        });
        knob.addEventListener('pointermove', e => { if (isDrag) process(e); });
        knob.addEventListener('pointerup', e => { isDrag = false; knob.releasePointerCapture(e.pointerId); });

        update(def);
        wrap.appendChild(knob); wrap.appendChild(lbl);
        return wrap;
    };

    // Wave Switch
    const createSwitch = () => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";
        const lbl = document.createElement('div');
        lbl.textContent = "WAVE"; lbl.style.cssText = "font-size:10px; color:#fff; font-family:sans-serif; font-weight:bold;";

        const sw = document.createElement('div');
        sw.style.cssText = "width:30px; height:50px; background:#444; border:1px solid #000; position:relative; cursor:pointer;";

        const handle = document.createElement('div');
        handle.style.cssText = "width:100%; height:25px; background:#ccc; position:absolute; top:0; border:1px solid #fff; box-sizing:border-box;";
        sw.appendChild(handle);

        let isSqr = false;
        const toggle = () => {
            isSqr = !isSqr;
            handle.style.top = isSqr ? "25px" : "0px";
            plugin.audioNode.setParamValue('wave', isSqr ? 1 : 0);
        };

        sw.addEventListener('click', e => { e.stopPropagation(); toggle(); });
        sw.addEventListener('pointerdown', e => e.stopPropagation());

        wrap.appendChild(sw);
        wrap.appendChild(lbl);
        return wrap;
    };

    panel.appendChild(createKnob("TUNING", "tuning", -1200, 1200, 0));
    panel.appendChild(createKnob("CUTOFF", "cutoff", 20, 5000, 400));
    panel.appendChild(createKnob("RES", "res", 0, 30, 10)); // ACIIID range
    panel.appendChild(createKnob("ENV MOD", "envMod", 0, 5000, 1500));
    panel.appendChild(createKnob("DECAY", "decay", 0.05, 2.0, 0.3));
    panel.appendChild(createKnob("ACCENT", "accent", 0, 1, 0.5));
    panel.appendChild(createSwitch());

    container.appendChild(panel);

    // Bottom: Mini Buttons Keyboard
    const keySection = document.createElement('div');
    keySection.style.cssText = "margin-top: 40px; display: flex; gap: 5px; width: 100%; justify-content: center;";

    const startNote = 36; // C2 Low Bass
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"];

    notes.forEach((n, i) => {
        const isBlack = n.includes("#");
        const btn = document.createElement('div');
        // Simple distinct buttons, 303 sequencer style
        const bg = isBlack ? "#333" : "#eee";
        const color = isBlack ? "#fff" : "#000";

        btn.style.cssText = `
            width: 30px; height: 30px; background: ${bg}; color: ${color};
            border-radius: 50%; border: 2px solid #777;
            display: flex; justify-content: center; align-items: center;
            font-size: 10px; font-weight: bold; cursor: pointer;
            box-shadow: 0 3px 5px rgba(0,0,0,0.5);
        `;
        if (i === 12) btn.style.background = "#f80"; // High C

        btn.textContent = n;

        const noteEvents = (e) => {
            e.stopPropagation(); e.preventDefault();
            btn.setPointerCapture(e.pointerId);
            btn.style.marginTop = "2px"; btn.style.boxShadow = "none";
            if (plugin.audioContext.state === 'suspended') plugin.audioContext.resume();
            plugin.audioNode.noteOn(startNote + i);
        };
        const upEvents = (e) => {
            btn.releasePointerCapture(e.pointerId);
            btn.style.marginTop = "0"; btn.style.boxShadow = "0 3px 5px rgba(0,0,0,0.5)";
            plugin.audioNode.noteOff(startNote + i);
        };

        btn.addEventListener('pointerdown', noteEvents);
        btn.addEventListener('pointerup', upEvents);
        btn.addEventListener('pointerleave', e => { if (e.pressure > 0) upEvents(e); });

        keySection.appendChild(btn);
    });

    // --- HELP BUTTON ---
    const helpBtn = document.createElement('div');
    helpBtn.textContent = "?";
    helpBtn.style.cssText = `
        position: absolute; top: 10px; right: 10px;
        width: 20px; height: 20px; border-radius: 50%;
        background: #333; color: #fff; font-weight: bold; font-family: sans-serif; font-size: 12px;
        display: flex; justify-content: center; align-items: center;
        border: 1px solid #666; cursor: pointer; z-index: 100;
    `;

    const helpOverlay = document.createElement('div');
    helpOverlay.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); color: #fff; font-family: monospace;
        display: none; flex-direction: column; justify-content: center; align-items: center;
        z-index: 200; padding: 20px; box-sizing: border-box; text-align: center;
    `;
    helpOverlay.innerHTML = `
        <h2 style="color:#f80; margin-bottom:10px;">MANUAL DE USO</h2>
        <p>1. Haz clic en el sintetizador para enfocarlo.</p>
        <p>2. Usa tu teclado para tocar:</p>
        <div style="display:flex; gap:10px; margin: 10px 0; color: #aaa;">
            <div>Z = Do (C)</div>
            <div>S = Do#</div>
            <div>X = Re (D)</div>
            <div>D = Re#</div>
            <div>C = Mi (E)</div>
            <div>V = Fa (F)</div>
        </div>
        <p style="color:#888; font-size: 10px; margin-top:20px;">(Clic para cerrar)</p>
    `;

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpOverlay.style.display = 'flex'; });
    helpOverlay.addEventListener('click', (e) => { e.stopPropagation(); helpOverlay.style.display = 'none'; });

    container.appendChild(helpBtn);
    container.appendChild(helpOverlay);

    // --- PC KEYBOARD LOGIC ---
    // Ensure container can receive focus
    container.tabIndex = 0;
    container.style.outline = "none"; // Hide default focus ring
    container.addEventListener('focus', () => container.style.boxShadow = "0 0 0 2px #f80, 0 20px 50px rgba(0,0,0,0.8)");
    container.addEventListener('blur', () => container.style.boxShadow = "0 20px 50px rgba(0,0,0,0.8)");

    const keyMap = {
        'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5,
        'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11, ',': 12
    };

    // Track active keys to prevent retriggering on held key
    const activeKeys = new Set();

    container.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const offset = keyMap[e.key.toLowerCase()];
        if (offset !== undefined) {
            e.preventDefault();
            e.stopPropagation();
            const note = startNote + offset;

            // Visual feedback
            const btn = keySection.children[offset];
            if (btn) {
                btn.style.background = "#888";
                btn.style.transform = "translateY(2px)";
            }

            if (plugin.audioContext.state === 'suspended') plugin.audioContext.resume();
            plugin.audioNode.noteOn(note);
            activeKeys.add(e.key);
        }
    });

    container.addEventListener('keyup', (e) => {
        const offset = keyMap[e.key.toLowerCase()];
        if (offset !== undefined) {
            e.preventDefault();
            e.stopPropagation();
            const note = startNote + offset;

            // Visual feedback reset
            const btn = keySection.children[offset];
            if (btn) {
                const isBlack = [1, 3, 6, 8, 10].includes(offset % 12);
                btn.style.background = (offset === 12 ? "#f80" : (isBlack ? "#333" : "#eee"));
                btn.style.transform = "none";
            }

            // Only noteOff if we haven't triggered a new note? 
            // Mono synth usually handles last-note-priority in Node, 
            // but simple implementation: just send off. Node checks if it matches playing note.
            plugin.audioNode.noteOff(note);
            activeKeys.delete(e.key);
        }
    });

    return container;
}
