// FullDrive GUI (White OCD Style)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #fdfdf8; /* Creamy White */
        width: 280px;
        height: 380px;
        border-radius: 10px;
        border: 2px solid #ccc;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        user-select: none;
        font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif; /* OCD Vibe */
        color: #111;
    `;

    // Header
    const title = document.createElement('div');
    title.innerHTML = "FullDrive";
    title.style.cssText = "font-size: 32px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #111; padding-bottom:5px;";
    container.appendChild(title);

    // Toggle Switch (HP/LP)
    const switchWrap = document.createElement('div');
    switchWrap.style.cssText = "margin-bottom: 20px; display: flex; align-items: center; gap: 10px;";

    const switchLabel = document.createElement('div');
    switchLabel.innerHTML = "<span style='color:red'>HP</span> / <span style='color:blue'>LP</span>";
    switchLabel.style.fontWeight = "bold";
    switchLabel.style.fontSize = "12px";

    // Toggle visual
    const toggle = document.createElement('div');
    toggle.style.cssText = `
        width: 30px; height: 16px; background: #ddd; border-radius: 8px; 
        position: relative; border: 1px solid #888; cursor: pointer;
    `;
    const check = document.createElement('div');
    check.style.cssText = `
        width: 14px; height: 14px; background: #333; border-radius: 50%;
        position: absolute; top: 1px; left: 15px; transition: left 0.1s;
    `;
    toggle.appendChild(check);

    let isHP = true;
    toggle.addEventListener('click', () => {
        isHP = !isHP;
        check.style.left = isHP ? '15px' : '1px'; // HP Right, LP Left? Or Vertical? OCD is mini toggle.
        plugin.audioNode.setParamValue('mode', isHP ? 1 : 0);
    });

    switchWrap.appendChild(toggle);
    switchWrap.appendChild(switchLabel);
    container.appendChild(switchWrap);

    // Knobs
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; gap: 20px; justify-content: center; width: 100%; margin-bottom: 40px;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: #111;
            border: 2px solid #555;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: #fff;
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "10px";
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
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            isDrag = true;
            startY = e.clientY;
            knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
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

    // OCD Layout usually 3 knobs in triangle or row. Row is simpler.
    knobsRow.appendChild(createKnob("VOL", "level", 0.5));
    knobsRow.appendChild(createKnob("DRIVE", "drive", 0.3));
    knobsRow.appendChild(createKnob("TONE", "tone", 0.5));

    container.appendChild(knobsRow);

    // Bypass
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 15px;";

    const led = document.createElement('div');
    led.style.cssText = "width: 12px; height: 12px; background: #f00; border-radius: 50%; box-shadow: 0 0 5px #f00;";
    footer.appendChild(led);

    const sw = document.createElement('div');
    sw.style.cssText = "width: 50px; height: 50px; background: radial-gradient(#999, #444); border-radius: 50%; border: 3px solid #666; cursor: pointer;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#333" : "#f00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 10px #f00";
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
