// BassSynth GUI - Silver Sliders
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #ddd; /* Light Silver */
        width: 450px;
        height: 350px;
        border-radius: 4px;
        border: 4px solid #111;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #111;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = "width: 100%; border-bottom: 4px solid #111; padding-bottom: 15px; margin-bottom: 20px; text-align: center;";
    header.innerHTML = "<span style='font-size: 28px; font-weight: 800; letter-spacing: -1px;'>BASS MICRO SYNTH</span>";
    container.appendChild(header);

    // Main Control Area: 2 Sections
    const mainWrap = document.createElement('div');
    mainWrap.style.cssText = "display: flex; gap: 40px; justify-content: center; width: 100%; height: 200px;";

    // Section 1: Voices
    const voicesWrap = document.createElement('div');
    voicesWrap.style.cssText = "display: flex; gap: 10px; border-right: 2px solid #999; padding-right: 20px;";

    // Section 2: Filter Sweep
    const filterWrap = document.createElement('div');
    filterWrap.style.cssText = "display: flex; gap: 10px;";

    // Robust Slider Factory (Reusing PolyOctave Fix)
    const createSlider = (label, param, def, color) => {
        const col = document.createElement('div');
        col.style.cssText = "display: flex; flex-direction: column; align-items: center; height: 100%; width: 40px;";

        // Track
        const trackHeight = 150;
        const track = document.createElement('div');
        track.style.cssText = `
            width: 6px; height: ${trackHeight}px; background: #333;
            position: relative; cursor: pointer;
        `;

        // Cap
        const cap = document.createElement('div');
        cap.style.cssText = `
            width: 30px; height: 16px; background: ${color}; 
            border: 1px solid #000; border-radius: 2px;
            position: absolute; left: -12px; top: 0; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
        `;
        const line = document.createElement('div');
        line.style.cssText = "width: 100%; height: 2px; background: rgba(255,255,255,0.8); margin-top: 7px;";
        cap.appendChild(line);
        track.appendChild(cap);

        // Label
        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 10px; text-align: center;";

        // Logic
        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const range = trackHeight - 16;
            const y = (1 - val) * range;
            cap.style.top = y + "px";
            plugin.audioNode.setParamValue(param, val);
        };

        let isDrag = false;

        track.addEventListener('pointerdown', e => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            isDrag = true; track.setPointerCapture(e.pointerId);
            const rect = track.getBoundingClientRect();
            let y = e.clientY - rect.top - 8;
            const range = trackHeight - 16;
            update(1 - (y / range));
        });

        track.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            const rect = track.getBoundingClientRect();
            let y = e.clientY - rect.top - 8;
            const range = trackHeight - 16;
            update(1 - (y / range));
        });

        track.addEventListener('pointerup', e => {
            e.preventDefault(); e.stopPropagation(); isDrag = false; track.releasePointerCapture(e.pointerId);
        });

        update(def);
        col.appendChild(track);
        col.appendChild(lbl);
        return col;
    };

    // VOICES SECTION (Black Caps)
    voicesWrap.appendChild(createSlider("SUB", "sub", 0.0, "#222"));
    voicesWrap.appendChild(createSlider("BASS", "guitar", 1.0, "#222"));
    voicesWrap.appendChild(createSlider("OCTAVE", "octave", 0.0, "#222"));
    voicesWrap.appendChild(createSlider("SQUARE", "square", 0.0, "#222")); // Fuzz

    // FILTER SECTION (Blue Caps)
    const blue = "#1976d2";
    filterWrap.appendChild(createSlider("RES", "res", 0.5, blue));
    filterWrap.appendChild(createSlider("START", "start", 0.2, blue));
    filterWrap.appendChild(createSlider("STOP", "stop", 0.8, blue));
    filterWrap.appendChild(createSlider("RATE", "rate", 0.5, blue));

    mainWrap.appendChild(voicesWrap);
    mainWrap.appendChild(filterWrap);
    container.appendChild(mainWrap);

    // Bypass
    const footer = document.createElement('div');
    footer.style.marginTop = "20px";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 100px; height: 30px; background: #222; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; cursor: pointer; border-radius: 4px;";
    sw.innerText = "BYPASS";

    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; border: 1px solid #000; margin-left: 10px;";
    sw.appendChild(led);

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#555" : "#f00";
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
