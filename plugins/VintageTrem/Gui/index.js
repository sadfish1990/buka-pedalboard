// VintageTrem GUI - Surf Green
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #a8e4d8; /* Surf Green */
        width: 250px;
        height: 350px;
        border-radius: 10px;
        border: 4px solid #fdfdf0; /* Cream Border */
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        user-select: none;
        font-family: 'Brush Script MT', cursive;
        color: #333;
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "Vintage Trem";
    title.style.cssText = "font-size: 36px; font-weight: normal; margin-bottom: 30px; text-shadow: 1px 1px 0 rgba(255,255,255,0.5);";
    container.appendChild(title);

    // Shape Selector (3 way toggle)
    const shapeWrap = document.createElement('div');
    shapeWrap.style.cssText = "margin-bottom: 25px; display: flex; flex-direction: column; align-items: center;";

    // Custom toggle logic
    const shapes = ["SINE", "TRI", "SQR"];
    const toggle = document.createElement('div');
    toggle.style.cssText = `
        display: flex; border: 2px solid #555; border-radius: 4px; overflow: hidden; background: #fff;
        font-family: 'Arial', sans-serif; font-weight: bold; font-size: 10px;
    `;

    const shapeBtns = [];
    shapes.forEach((s, idx) => {
        const btn = document.createElement('div');
        btn.textContent = s;
        btn.style.cssText = "padding: 4px 8px; cursor: pointer; background: #fff;";
        if (idx < 2) btn.style.borderRight = "1px solid #ccc";

        btn.addEventListener('click', () => {
            const val = idx * 0.5; // 0, 0.5, 1.0
            plugin.audioNode.setParamValue('shape', val);
            updateShapeUI(idx);
        });

        btn.addEventListener('pointerdown', e => { e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault(); });

        shapeBtns.push(btn);
        toggle.appendChild(btn);
    });

    const updateShapeUI = (idx) => {
        shapeBtns.forEach((b, i) => {
            if (i === idx) {
                b.style.background = "#333";
                b.style.color = "#fff";
            } else {
                b.style.background = "#fff";
                b.style.color = "#333";
            }
        });
    };
    updateShapeUI(0);

    shapeWrap.appendChild(toggle);
    container.appendChild(shapeWrap);

    // Knobs
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; gap: 30px; justify-content: center; width: 100%; margin-bottom: 40px;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: #442211; /* Bakelite Brown */
            border: 2px solid #fdfdf0;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: #fdfdf0;
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "10px";
        lbl.style.fontFamily = "Arial, sans-serif";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "12px";

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
            isDrag = true;
            startY = e.clientY;
            knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
            const delta = (startY - e.clientY) * 0.005;
            update(val + delta);
            startY = e.clientY;
        });

        knob.addEventListener('pointerup', e => {
            e.stopPropagation();
            isDrag = false;
            knob.releasePointerCapture(e.pointerId);
        });

        update(def);
        wrap.appendChild(knob);
        wrap.appendChild(lbl);
        return wrap;
    };

    knobsRow.appendChild(createKnob("SPEED", "speed", 0.5));
    knobsRow.appendChild(createKnob("DEPTH", "depth", 0.7));

    container.appendChild(knobsRow);

    // Bypass
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px;";

    // Pulsing LED (Syncs with speed?)
    // Complex to sync 100% without RAF from node, but we can fake it with CSS animation speed update
    const led = document.createElement('div');
    led.style.cssText = "width: 15px; height: 15px; background: #ff0000; border-radius: 50%; box-shadow: 0 0 5px #ff0000; opacity: 0.5;";
    // Animation style
    const animStyle = document.createElement('style');
    animStyle.textContent = `@keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }`;
    container.appendChild(animStyle);
    led.style.animation = "pulse 1s infinite ease-in-out";

    footer.appendChild(led);

    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#ddd, #999); border-radius: 50%; border: 3px solid #666; cursor: pointer;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.display = isBypassed ? "none" : "block";
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
