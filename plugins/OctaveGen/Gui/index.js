// PolyOctave GUI - 5 Knobs
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #1a2a40;
        width: 400px;
        height: 320px;
        border-radius: 12px;
        border: 4px solid #4a90e2;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #fff;
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "<div style='font-size:24px; font-weight:bold; letter-spacing:3px; color:#4a90e2; text-shadow:0 0 10px rgba(74,144,226,0.5);'>POLY OCTAVE</div><div style='font-size:10px; color:#8ab; margin-top:2px;'>CLEAN GENERATOR</div>";
    title.style.cssText = "text-align:center; margin-bottom: 25px; width:100%; border-bottom:1px solid #2c4c70; padding-bottom:10px;";
    container.appendChild(title);

    // Knobs Area
    const knobsWrap = document.createElement('div');
    knobsWrap.style.cssText = "display: flex; gap: 15px; justify-content: center; align-items: flex-end; width: 100%; margin-bottom: 30px;";

    const createKnob = (label, param, color) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #444, #111);
            border: 2px solid ${color};
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 3px; height: 40%; background: ${color};
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
            box-shadow: 0 0 5px ${color};
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = `margin-top: 8px; font-weight: bold; font-size: 11px; color: ${color};`;

        let val = 0;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            indicator.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);
        };

        // Grab Logic
        let isDrag = false;
        let grabOffset = 0; // Relative Y

        knob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            isDrag = true;
            // Calculate pseudo "value" at click? No, knobs are relative drag usually.
            // But let's use the delta logic.
            const rect = knob.getBoundingClientRect();
            // Just standard drag
            knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation();
            const delta = -e.movementY * 0.01;
            update(val + delta);
        });

        knob.addEventListener('pointerup', e => {
            isDrag = false;
            knob.releasePointerCapture(e.pointerId);
        });

        // Set default
        if (param === 'dry') update(1.0); else update(0.0);

        wrap.appendChild(knob);
        wrap.appendChild(lbl);
        return wrap;
    };

    // Color code
    knobsWrap.appendChild(createKnob("-2 OCT", "sub2", "#ff4444")); // Red
    knobsWrap.appendChild(createKnob("-1 OCT", "sub1", "#ffaa44")); // Orange
    knobsWrap.appendChild(createKnob("DRY", "dry", "#ffffff")); // White
    knobsWrap.appendChild(createKnob("+1 OCT", "up1", "#44aaff")); // Blue
    knobsWrap.appendChild(createKnob("+2 OCT", "up2", "#44ffaa")); // Cyan (Teal)

    container.appendChild(knobsWrap);

    // Bypass
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px;";

    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #00ff00; border-radius: 50%; box-shadow: 0 0 10px #00ff00;";
    footer.appendChild(led);

    const sw = document.createElement('div');
    sw.style.cssText = "width: 50px; height: 30px; border-radius: 4px; background: #ccc; border: 2px solid #888; cursor: pointer;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#333" : "#00ff00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 10px #00ff00";
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
