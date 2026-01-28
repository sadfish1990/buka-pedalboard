// BassDriver GUI - Black/Yellow
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #111; /* Classic Black */
        width: 400px;
        height: 280px;
        border-radius: 4px;
        border: 4px solid #fdd835; /* Yellow border */
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Helvetica', sans-serif;
        color: #fdd835; /* Yellow Text */
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "BassDriver";
    title.style.cssText = "font-size: 28px; font-weight: bold; margin-bottom: 5px; font-style: italic;";
    container.appendChild(title);

    const sub = document.createElement('div');
    sub.innerHTML = "TUBE AMPLIFIER EMULATOR";
    sub.style.cssText = "font-size: 10px; font-weight: bold; margin-bottom: 25px; letter-spacing: 1px; color: #fff;";
    container.appendChild(sub);

    // Knobs Layout (2 Rows of 3)
    const knobsWrap = document.createElement('div');
    knobsWrap.style.cssText = "display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 30px;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: #222; border: 2px solid #fdd835;
            position: relative; cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: #fdd835;
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "8px";
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

    // Row 1
    knobsWrap.appendChild(createKnob("LEVEL", "level", 0.7));
    knobsWrap.appendChild(createKnob("BLEND", "blend", 0.8));
    knobsWrap.appendChild(createKnob("TREBLE", "treble", 0.5));

    // Row 2
    knobsWrap.appendChild(createKnob("DRIVE", "drive", 0.4));
    knobsWrap.appendChild(createKnob("PRESENCE", "presence", 0.5));
    knobsWrap.appendChild(createKnob("BASS", "bass", 0.6));

    container.appendChild(knobsWrap);

    // Footer
    const footer = document.createElement('div');
    footer.style.marginTop = "auto";
    footer.style.display = "flex";
    footer.style.gap = "15px";
    footer.style.alignItems = "center";

    // Bypass Switch
    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #666; cursor: pointer;";
    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; box-shadow: 0 0 5px #f00;";

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
