// BassFuzz GUI - Green Russian (Grid Layout Fixed)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #3b4d3b; /* Dark Military Green */
        width: 320px;
        height: 400px; /* Taller to fit grid comfortably */
        border-radius: 4px;
        border: 4px solid #111;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Courier New', monospace;
        color: #e5bd00; /* Vintage Yellow */
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "BASS FUZZ";
    title.style.cssText = "font-size: 32px; font-weight: bold; margin-bottom: 5px; text-shadow: 2px 2px 0px #000;";
    container.appendChild(title);

    const sub = document.createElement('div');
    sub.innerHTML = "ЛЮБОВЬ К БАСУ";
    sub.style.cssText = "font-size: 14px; font-weight: bold; margin-bottom: 20px; color: #000;";
    container.appendChild(sub);

    // Controls Layout: CSS Grid for Perfect Symmetry
    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid; 
        grid-template-columns: 1fr 1fr 1fr; 
        grid-template-rows: auto auto; 
        gap: 10px; 
        width: 100%;
        justify-items: center;
        align-items: end; /* Align bottoms of knobs */
        margin-bottom: 20px;
    `;

    const createKnob = (label, param, def, size = 60) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: ${size}px; height: ${size}px; border-radius: 50%;
            background: #111; border: 2px solid #555;
            position: relative; cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.7);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: #e5bd00;
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "8px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "14px";

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
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            isDrag = true; startY = e.clientY; knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
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

    // Tone (Top Center) - Row 1, Col 2
    const toneKnob = createKnob("TONE", "tone", 0.5, 70);
    toneKnob.style.gridColumn = "2";
    toneKnob.style.gridRow = "1";
    grid.appendChild(toneKnob);

    // Vol (Bottom Left) - Row 2, Col 1
    const volKnob = createKnob("VOL", "vol", 0.5, 70);
    volKnob.style.gridColumn = "1";
    volKnob.style.gridRow = "2";
    grid.appendChild(volKnob);

    // Blend (Bottom Center) - Row 2, Col 2 (Small)
    const blendKnob = createKnob("BLEND", "blend", 0.5, 45); // Smaller
    blendKnob.style.gridColumn = "2";
    blendKnob.style.gridRow = "2";
    blendKnob.style.marginBottom = "5px"; // Slight adjust
    grid.appendChild(blendKnob);

    // Sustain (Bottom Right) - Row 2, Col 3
    const susKnob = createKnob("SUSTAIN", "sustain", 0.5, 70);
    susKnob.style.gridColumn = "3";
    susKnob.style.gridRow = "2";
    grid.appendChild(susKnob);

    container.appendChild(grid);

    // Bypass
    const footer = document.createElement('div');
    footer.style.marginTop = "auto";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#888, #444); border-radius: 50%; border: 4px solid #222; cursor: pointer; margin: 0 auto;";

    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 10px auto 5px auto; box-shadow: 0 0 5px #f00;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#333" : "#f00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 5px #f00";
    });

    footer.appendChild(led);
    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
