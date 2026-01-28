// MistressFlanger GUI - Black/Green
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #111; /* Pitch Black */
        width: 340px;
        height: 380px;
        border-radius: 4px;
        border: 4px solid #aaf; /* Light metallic trim? Or Green? Mistress has green txt */
        /* Let's go with Green border for visibility */
        border-color: #eee;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Courier New', monospace;
        color: #3f3; /* Terminal Green */
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "ELECTRIC<br>MISTRESS";
    title.style.cssText = "font-size: 32px; font-weight: bold; margin-bottom: 40px; text-align: center; text-shadow: 0 0 10px #3f3;";
    container.appendChild(title);

    // Controls Layout
    const controlsArea = document.createElement('div');
    controlsArea.style.cssText = "display: flex; gap: 25px; margin-bottom: 40px;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 55px; height: 55px; border-radius: 50%;
            background: #ddd; border: 2px solid #fff;
            position: relative; cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: #111;
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "8px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "14px";
        lbl.style.color = "#3f3";

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

    controlsArea.appendChild(createKnob("RATE", "rate", 0.5));
    controlsArea.appendChild(createKnob("RANGE", "range", 0.5));
    controlsArea.appendChild(createKnob("COLOR", "color", 0.5));

    container.appendChild(controlsArea);

    // Filter Matrix Switch
    const matrixWrap = document.createElement('div');
    matrixWrap.style.display = "flex";
    matrixWrap.style.flexDirection = "column";
    matrixWrap.style.alignItems = "center";

    const matrixLabel = document.createElement('div');
    matrixLabel.textContent = "FILTER MATRIX";
    matrixLabel.style.marginBottom = "5px";
    matrixLabel.style.fontWeight = "bold";

    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 50px; height: 25px; border: 2px solid #3f3; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px;";

    const indicator = document.createElement('div');
    indicator.style.cssText = "width: 100%; height: 100%; background: #3f3; opacity: 0; transition: opacity 0.2s;";
    toggle.appendChild(indicator);

    let isMatrix = false;
    toggle.addEventListener('click', () => {
        isMatrix = !isMatrix;
        indicator.style.opacity = isMatrix ? 1.0 : 0.0;
        plugin.audioNode.setParamValue('matrix', isMatrix ? 1 : 0);
    });

    matrixWrap.appendChild(matrixLabel);
    matrixWrap.appendChild(toggle);

    container.appendChild(matrixWrap);

    // Bypass Footer
    const footer = document.createElement('div');
    footer.style.marginTop = "auto";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #777; cursor: pointer;";
    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 0 auto 5px auto; box-shadow: 0 0 5px #f00;";

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
