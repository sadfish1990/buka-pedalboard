// SuperLead GUI - Purple Chassis
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #551a8b; /* Deep Purple */
        width: 550px;
        height: 220px;
        border: 4px solid #111;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Times New Roman', serif;
        color: #fff;
        position: relative;
    `;

    // Logo
    const brand = document.createElement('div');
    brand.innerHTML = "Soldano";
    brand.style.cssText = `
        font-style: italic; font-size: 40px; font-weight: bold; 
        text-shadow: 2px 2px 0 #000;
        position: absolute; top: 15px; left: 30px;
        font-family: cursive;
    `;
    container.appendChild(brand);

    const sub = document.createElement('div');
    sub.innerHTML = "SUPER LEAD 100";
    sub.style.cssText = "font-size: 10px; font-weight: bold; position: absolute; top: 65px; left: 40px; font-family: sans-serif;";
    container.appendChild(sub);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; gap: 20px; margin-top: 70px; align-items: start;";

    // White Knob Factory
    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background: #fff; /* White Knobs */
            position: relative; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        // Indicator
        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 16px; background: #000;
            position: absolute; top: 2px; left: 18.5px;
            transform-origin: bottom center;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 8px; font-family: sans-serif;";

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
            e.preventDefault(); e.stopPropagation(); isDrag = false; knob.releasePointerCapture(e.pointerId);
        });

        update(def);
        wrap.appendChild(knob);
        wrap.appendChild(lbl);
        return wrap;
    };

    // Layout
    controls.appendChild(createKnob("OVERDRIVE", "gain", 0.5));
    controls.appendChild(createKnob("BASS", "bass", 0.5));
    controls.appendChild(createKnob("MIDDLE", "mid", 0.5));
    controls.appendChild(createKnob("TREBLE", "treble", 0.5));
    controls.appendChild(createKnob("MASTER", "master", 0.5));
    controls.appendChild(createKnob("PRESENCE", "presence", 0.5));
    controls.appendChild(createKnob("DEPTH", "depth", 0.5)); // The key mod

    container.appendChild(controls);

    // Power (Big Toggle)
    const powerWrap = document.createElement('div');
    powerWrap.style.cssText = "position: absolute; right: 30px; top: 30px; display: flex; align-items: center; gap: 10px;";

    const light = document.createElement('div');
    light.style.cssText = "width: 15px; height: 15px; background: #50f; border-radius: 2px; box-shadow: 0 0 10px #50f; border: 1px solid #fff;";

    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 15px; height: 25px; background: #ccc; border: 1px solid #000; cursor: pointer; display: flex; align-items: center; justify-content: center;";
    const spot = document.createElement('div');
    spot.style.cssText = "width: 5px; height: 5px; background: #000; border-radius: 50%;";
    toggle.appendChild(spot);

    let isBypassed = false;
    toggle.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        if (isBypassed) {
            light.style.background = "#204";
            light.style.boxShadow = "none";
            spot.style.background = "#000";
        } else {
            light.style.background = "#50f";
            light.style.boxShadow = "0 0 10px #50f";
            spot.style.background = "#555";
        }
    });

    powerWrap.appendChild(light);
    powerWrap.appendChild(toggle);
    container.appendChild(powerWrap);

    return container;
}
