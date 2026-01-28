// AutoFunk GUI - AF-9 Style with Sliders
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #6a0dad; /* Purple */
        width: 300px;
        height: 420px;
        border-radius: 10px;
        border: 4px solid #4b0082;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
        color: #fff;
    `;

    // Logo
    const header = document.createElement('div');
    header.style.cssText = "width: 100%; text-align: center; margin-bottom: 20px;";
    header.innerHTML = "<div style='font-size:28px; font-weight:bold; width:100%; border-bottom:2px solid rgba(255,255,255,0.3); padding-bottom:5px;'>Auto Funk</div><div style='font-size:12px; margin-top:5px; opacity:0.8;'>AUTO FILTER</div>";
    container.appendChild(header);

    // Switches Row (Filter Type, Drive, Range)
    const switchesRow = document.createElement('div');
    switchesRow.style.cssText = "display: flex; gap: 10px; width: 100%; justify-content: center; margin-bottom: 25px;";

    const createToggle = (label, param, options) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.fontSize = "10px";
        lbl.style.marginBottom = "5px";
        wrap.appendChild(lbl);

        const btn = document.createElement('div');
        btn.style.cssText = "background: #333; border: 1px solid #fff; padding: 2px 5px; font-size:10px; cursor: pointer; border-radius: 3px; min-width: 40px; text-align: center;";
        btn.textContent = options[0];

        let idx = 0;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            idx = (idx + 1) % options.length;
            btn.textContent = options[idx];
            // Normalize value 0..1 based on index
            // If 2 options: 0, 1 -> 0.0, 1.0 (ok)
            // If 3 options: 0, 1, 2 -> 0.0, 0.5, 1.0
            const val = options.length === 2 ? idx : idx * 0.5;
            plugin.audioNode.setParamValue(param, val);
        });

        wrap.appendChild(btn);
        return wrap;
    };

    switchesRow.appendChild(createToggle("FILTER", "filter", ["LP", "BP", "HP"]));
    switchesRow.appendChild(createToggle("DRIVE", "drive", ["UP", "DOWN"]));
    switchesRow.appendChild(createToggle("RANGE", "range", ["LOW", "HIGH"]));

    container.appendChild(switchesRow);

    // Filter Sliders Area
    const slidersWrap = document.createElement('div');
    slidersWrap.style.cssText = "display: flex; gap: 40px; height: 200px; width: 100%; justify-content: center; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 15px;";

    const createSlider = (label, param, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; height: 100%; position: relative; width: 40px;";

        // Track
        const track = document.createElement('div');
        track.style.cssText = "width: 6px; height: 150px; background: #222; border-radius: 3px; position: relative;";
        wrap.appendChild(track);

        // Thumb
        const thumb = document.createElement('div');
        thumb.style.cssText = "width: 30px; height: 15px; background: #fff; border-radius: 2px; position: absolute; left: 5px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5);";
        // Center thumb horizontally: track is 6px wide at center (20px). Wrapper is 40.
        // Left offset for thumb to be centered: (40 - 30)/2 = 5px.

        // Logic
        let val = defaultVal;
        const h = 150 - 15; // Track height - Thumb height

        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            // Invert Y: 1.0 is top (0px), 0.0 is bottom (h px)
            const top = h - (val * h);
            thumb.style.top = `${top}px`;
            plugin.audioNode.setParamValue(param, val);
        };

        // Interaction Logic using Thumb Capture with Grab Offset
        let isDragging = false;
        let grabOffset = 0;

        const handleMove = (e) => {
            if (!isDragging) return;
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();

            const rect = track.getBoundingClientRect();
            // Calculate relative Y from the top of the track using grabOffset
            let y = e.clientY - rect.top - grabOffset;

            const trackHeight = 150; // Defined in CSS below
            const thumbH = 15;
            const availableH = trackHeight - thumbH;

            // Clamp
            y = Math.max(0, Math.min(availableH, y));

            const norm = 1 - (y / availableH); // 1.0 = Top, 0.0 = Bottom
            update(norm);
        };

        const handleUp = (e) => {
            if (!isDragging) return;
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            isDragging = false;
            thumb.releasePointerCapture(e.pointerId);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        // THUMB Interaction START
        thumb.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();

            isDragging = true;

            // Calculate offset: Where inside the thumb did we click?
            const thumbRect = thumb.getBoundingClientRect();
            grabOffset = e.clientY - thumbRect.top;

            thumb.setPointerCapture(e.pointerId);
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        });

        // Disable Track Click Jumping - It confuses the user and causes jumps
        track.addEventListener('pointerdown', (e) => {
            if (e.target === thumb) return; // Pass through if clicked on thumb
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            // Do nothing on track click (no jump)
        });

        // Prevent host drag
        wrap.addEventListener('pointerdown', e => { e.stopPropagation(); });
        wrap.addEventListener('mousedown', e => { e.stopPropagation(); });

        // Label
        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "10px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "12px";

        update(defaultVal);
        track.appendChild(thumb);
        wrap.appendChild(lbl);
        return wrap;
    };

    slidersWrap.appendChild(createSlider("SENS", "sens", 0.5));
    slidersWrap.appendChild(createSlider("PEAK", "peak", 0.5));

    container.appendChild(slidersWrap);

    // Footer (LED + Footswitch)
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center; margin-top: 20px; gap: 10px;";

    const led = document.createElement('div');
    led.style.cssText = "width: 12px; height: 12px; background: #f00; border-radius: 50%; box-shadow: 0 0 5px #f00;";
    footer.appendChild(led);

    const sw = document.createElement('div');
    sw.style.cssText = "width: 50px; height: 50px; background: radial-gradient(#666, #111); border-radius: 50%; border: 3px solid #ccc; cursor: pointer;";

    let isBypassed = false;
    sw.addEventListener('click', (e) => {
        isBypassed = !isBypassed;
        led.style.background = isBypassed ? "#333" : "#f00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 5px #f00";
        plugin.audioNode.setBypass(isBypassed);
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
