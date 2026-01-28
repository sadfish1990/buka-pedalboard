// VibeMachine GUI - Metallic Grey (Pure Vibrato Edition)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #505055; /* Metallic Grey */
        width: 300px;
        height: 400px;
        border-radius: 8px;
        border: 4px solid #d0d0d0; /* Chrome */
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial Black', sans-serif;
        color: #fff;
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "VibeMachine";
    title.style.cssText = "font-size: 28px; margin-bottom: 50px; letter-spacing: -1px; text-shadow: 0 2px 4px #000;";
    container.appendChild(title);

    // Knobs Area - Clean Layout
    const knobsArea = document.createElement('div');
    knobsArea.style.cssText = "position: relative; width: 100%; height: 200px; display: flex; justify-content: center;";

    // Helper to create knob
    const createKnob = (label, param, def, size, x, y) => {
        const wrap = document.createElement('div');
        // Absolute postioning
        wrap.style.cssText = `position: absolute; left: ${x}px; top: ${y}px; display: flex; flex-direction: column; align-items: center;`;

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: ${size}px; height: ${size}px; border-radius: 50%;
            background: conic-gradient(#444 0%, #111 100%);
            border: 3px solid #ccc;
            position: relative; cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: ${size * 0.08}px; height: 40%; background: #fff;
            position: absolute; top: 5px; left: 50%; margin-left: -${size * 0.04}px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "10px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "12px";
        lbl.style.color = "#ddd";
        lbl.style.textShadow = "0 1px 2px black";

        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            line.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);
        };

        let isDrag = false;
        let startY = 0;

        knob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
            isDrag = true; startY = e.clientY; knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
            const delta = (startY - e.clientY) * 0.005;
            update(val + delta);
            startY = e.clientY;
        });

        knob.addEventListener('pointerup', e => {
            e.stopPropagation(); isDrag = false; knob.releasePointerCapture(e.pointerId);
        });

        update(def);
        wrap.appendChild(knob);
        wrap.appendChild(lbl);
        return wrap;
    };

    // Layout: Speed Center, Intensity Bottom Right
    // Speed: Center X (105), Top Y (40)
    knobsArea.appendChild(createKnob("SPEED", "speed", 0.4, 90, 105, 40));

    // Intensity: Right aligned
    knobsArea.appendChild(createKnob("DEPTH", "intensity", 0.7, 50, 210, 140));

    container.appendChild(knobsArea);

    // Bypass
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center; margin-top: auto;";

    const led = document.createElement('div');
    led.style.cssText = "width: 15px; height: 15px; background: #ff0000; border-radius: 50%; box-shadow: 0 0 5px #ff0000; margin-bottom: 10px;";
    footer.appendChild(led);

    const sw = document.createElement('div');
    sw.style.cssText = "width: 50px; height: 30px; background: #ccc; border-radius: 4px; border: 2px solid #888; cursor: pointer;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#333" : "#ff0000";
        led.style.boxShadow = isBypassed ? "none" : "0 0 5px #ff0000";
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
