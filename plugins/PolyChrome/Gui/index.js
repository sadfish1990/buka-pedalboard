// PolyChrome GUI - Green/Steel
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #ced4da; /* Steel */
        width: 320px;
        height: 480px;
        border-radius: 4px;
        border: 4px solid #444;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #111;
        position: relative;
    `;

    // Green Graphic Overlay
    const graphic = document.createElement('div');
    graphic.style.cssText = `
        position: absolute; top: 80px; left: 20px; width: 280px; height: 300px;
        background: #28a745; clip-path: polygon(0 0, 100% 20%, 100% 80%, 0 100%);
        z-index: 0; opacity: 0.8;
    `;
    container.appendChild(graphic);

    // Title
    const title = document.createElement('div');
    title.innerHTML = "PolyChrome";
    title.style.cssText = "font-size: 32px; font-weight: bold; margin-bottom: 60px; z-index: 1; margin-top:20px; letter-spacing: -2px;";
    container.appendChild(title);

    // Mode Switch
    const switchWrap = document.createElement('div');
    switchWrap.style.cssText = "margin-bottom: 30px; display: flex; flex-direction: column; align-items: center; z-index: 1;";

    // Custom 3-way switch
    const switchBox = document.createElement('div');
    switchBox.style.cssText = "display: flex; border: 2px solid #111; background: #fff; border-radius: 4px; overflow: hidden;";

    const modes = ["CHORUS", "FLANGE", "MATRIX"];
    const buttons = [];

    const updateModeUI = (idx) => {
        buttons.forEach((b, i) => {
            if (i === idx) {
                b.style.background = "#111"; b.style.color = "#fff";
            } else {
                b.style.background = "#fff"; b.style.color = "#111";
            }
        });
    };

    modes.forEach((m, idx) => {
        const btn = document.createElement('div');
        btn.textContent = m;
        btn.style.cssText = "padding: 5px 10px; cursor: pointer; font-size: 10px; font-weight: bold;";
        if (idx < 2) btn.style.borderRight = "1px solid #ccc";

        btn.addEventListener('click', () => {
            plugin.audioNode.setParamValue('mode', idx);
            updateModeUI(idx);
        });
        buttons.push(btn);
        switchBox.appendChild(btn);
    });
    updateModeUI(0); // init

    switchWrap.appendChild(switchBox);
    container.appendChild(switchWrap);

    // 4 Knobs Grid
    const knobsGrid = document.createElement('div');
    knobsGrid.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; z-index: 1; margin-bottom: 40px;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: conic-gradient(#333 0%, #000 100%);
            border: 2px solid #888;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 2px; height: 40%; background: #fff;
            position: absolute; top: 5px; left: 50%; margin-left: -1px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "5px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "11px";
        lbl.style.background = "rgba(255,255,255,0.8)";
        lbl.style.padding = "2px 4px";
        lbl.style.borderRadius = "2px";

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

    knobsGrid.appendChild(createKnob("WIDTH", "width", 0.5));
    knobsGrid.appendChild(createKnob("RATE", "rate", 0.3));
    knobsGrid.appendChild(createKnob("TUNE", "tune", 0.5));
    knobsGrid.appendChild(createKnob("FEEDBACK", "feedback", 0.5));

    container.appendChild(knobsGrid);

    // Bypass
    const footer = document.createElement('div');
    footer.style.zIndex = "1";
    footer.style.display = "flex";
    footer.style.flexDirection = "column";
    footer.style.alignItems = "center";

    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #333; cursor: pointer;";
    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 0 auto 10px auto; box-shadow: 0 0 5px #f00;";

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
