// ModernBass GUI - Darkglass / GK Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #2a2a2e; /* Dark Gunmetal */
        width: 500px;
        height: 280px;
        border-radius: 6px;
        border: 2px solid #111;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Segoe UI', sans-serif;
        color: #eee;
    `;

    // Branding
    const brand = document.createElement('div');
    brand.style.cssText = "width: 100%; border-bottom: 2px solid #00bfff; padding-bottom: 5px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: end;";

    const logo = document.createElement('span');
    logo.innerHTML = "MODERN<span style='color:#00bfff; font-weight:bold;'>BASS</span>";
    logo.style.fontSize = "22px";
    logo.style.letterSpacing = "2px";

    brand.appendChild(logo);
    container.appendChild(brand);

    // Controls: 2 Rows
    // Row 1: Tone Shaping (Contour, Bass, LoMid, HiMid, Treble)
    // Row 2: Drive Section (Drive, Blend, Master)

    const row1 = document.createElement('div');
    row1.style.cssText = "display: flex; gap: 15px; margin-bottom: 30px;";

    const row2 = document.createElement('div');
    row2.style.cssText = "display: flex; gap: 30px; align-items: center;";

    const createKnob = (label, param, def, color = '#00bfff', size = 45) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: ${size}px; height: ${size}px; border-radius: 50%;
            background: #111; border: 2px solid #444;
            position: relative; cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        `;

        // LED Ring effect (Static for now, just style)
        knob.style.boxShadow = `0 0 5px ${color}33, inset 0 0 10px ${color}11`;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: ${color};
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
            box-shadow: 0 0 5px ${color};
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 10px; font-weight: 600; margin-top: 10px; color: #ccc; letter-spacing: 1px;";

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
            e.preventDefault(); e.stopPropagation(); isDrag = true; startY = e.clientY; knob.setPointerCapture(e.pointerId);
        });
        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.preventDefault(); e.stopPropagation();
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

    // EQ Row
    row1.appendChild(createKnob("CONTOUR", "contour", 0.0, "#fff")); // White for contour
    row1.appendChild(createKnob("BASS", "bass", 0.5));
    row1.appendChild(createKnob("LO-MID", "lomid", 0.5));
    row1.appendChild(createKnob("HI-MID", "himid", 0.5));
    row1.appendChild(createKnob("TREBLE", "treble", 0.5));

    container.appendChild(row1);

    // Drive Row
    const driveColor = "#ff3333"; // Red for drive
    row2.appendChild(createKnob("DRIVE", "drive", 0.2, driveColor, 55));
    row2.appendChild(createKnob("BLEND", "blend", 0.0, driveColor, 55));

    // Spacer
    const sep = document.createElement('div');
    sep.style.cssText = "width: 1px; height: 50px; background: #444; margin: 0 10px;";
    row2.appendChild(sep);

    row2.appendChild(createKnob("MASTER", "master", 0.7, "#fff", 60));

    container.appendChild(row2);

    // Bypass
    const footer = document.createElement('div');
    footer.style.position = "absolute"; footer.style.right = "20px"; footer.style.top = "20px";
    const btn = document.createElement('div');
    btn.style.cssText = "padding: 5px 10px; border: 1px solid #00bfff; color: #00bfff; font-size: 10px; cursor: pointer; border-radius: 4px; transition: all 0.2s;";
    btn.innerText = "ACTIVE";

    let isBypassed = false;
    btn.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        if (isBypassed) {
            btn.style.background = "transparent";
            btn.style.color = "#555";
            btn.style.borderColor = "#555";
            btn.innerText = "BYPASS";
        } else {
            btn.style.background = "rgba(0, 191, 255, 0.1)";
            btn.style.color = "#00bfff";
            btn.style.borderColor = "#00bfff";
            btn.innerText = "ACTIVE";
        }
    });

    footer.appendChild(btn);
    container.appendChild(footer);

    return container;
}
