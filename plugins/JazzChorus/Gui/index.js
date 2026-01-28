// JazzChorus GUI - Industrial Rivets
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #333; /* Dark Grey Chassis */
        width: 550px;
        height: 240px;
        border: 4px solid #111;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #eee;
        position: relative;
    `;

    // Rivets (Corner decorations)
    const addRivet = (x, y) => {
        const r = document.createElement('div');
        r.style.cssText = `
            position: absolute; left: ${x}px; top: ${y}px;
            width: 8px; height: 8px; background: #aaa; border-radius: 50%;
            box-shadow: inset 1px 1px 2px #fff, 1px 1px 2px #000;
        `;
        container.appendChild(r);
    };
    addRivet(10, 10); addRivet(530, 10);
    addRivet(10, 220); addRivet(530, 220);

    // Branding
    const brand = document.createElement('div');
    brand.innerHTML = "Roland <span style='font-size:12px; color:#aaa; margin-left:10px;'>JC-120</span>";
    brand.style.cssText = "position: absolute; top: 15px; left: 30px; font-weight: bold; font-family: sans-serif; font-size: 20px; letter-spacing: 1px;";
    container.appendChild(brand);

    const sub = document.createElement('div');
    sub.innerHTML = "JAZZ CHORUS";
    sub.style.cssText = "position: absolute; top: 40px; left: 30px; font-size: 10px; color: #aaa; letter-spacing: 2px;";
    container.appendChild(sub);

    // Controls Container
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; gap: 20px; margin-top: 60px; align-items: start;";

    // Roland Knob Factory (Grey Cap)
    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background: #111;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        `;

        // Grey Cap
        const cap = document.createElement('div');
        cap.style.cssText = `
            width: 34px; height: 34px; border-radius: 50%;
            background: linear-gradient(135deg, #666, #333);
            position: absolute; top: 3px; left: 3px;
        `;
        knob.appendChild(cap);

        // Indicator
        const line = document.createElement('div');
        line.style.cssText = `
            width: 2px; height: 16px; background: #orange; background: #ffaa00;
            position: absolute; top: 2px; left: 19px;
            transform-origin: bottom center;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 8px; color: #ccc;";

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

    // Switch (Lever)
    const createLever = (label, param) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; padding-bottom: 25px;";

        const housing = document.createElement('div');
        housing.style.cssText = "width: 40px; height: 20px; background: #222; border: 1px solid #555; position: relative; cursor: pointer; border-radius: 2px;";

        const stick = document.createElement('div');
        stick.style.cssText = "width: 10px; height: 20px; background: #ddd; position: absolute; left: 15px; top: 0px; box-shadow: 1px 1px 2px #000;";
        housing.appendChild(stick);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 5px; color: #ccc; text-align: center;";

        // 3 States: Off, Chorus, Vib
        let state = 1; // Default Chorus
        const map = ["OFF", "CHORUS", "VIB"];

        housing.addEventListener('click', () => {
            state = (state + 1) % 3;
            // Update position
            if (state == 0) stick.style.left = "2px";
            if (state == 1) stick.style.left = "15px";
            if (state == 2) stick.style.left = "28px";

            lbl.innerText = map[state];
            plugin.audioNode.setParamValue(param, state);
        });

        wrap.appendChild(housing);
        wrap.appendChild(lbl);
        return wrap;
    };

    // Channel 1 (Dist, Vol, EQ)
    controls.appendChild(createKnob("DIST", "dist", 0.0));
    controls.appendChild(createKnob("VOLUME", "vol", 0.7));
    controls.appendChild(createKnob("TREBLE", "treble", 0.5));
    controls.appendChild(createKnob("MIDDLE", "mid", 0.5));
    controls.appendChild(createKnob("BASS", "bass", 0.5));

    // Chorus Section (Boxed)
    const chorusBox = document.createElement('div');
    chorusBox.style.cssText = "display: flex; gap: 15px; padding: 10px; background: #2a2a2a; border-radius: 4px; border: 1px solid #444; align-items: end;";

    chorusBox.appendChild(createKnob("SPEED", "speed", 0.5));
    chorusBox.appendChild(createKnob("DEPTH", "depth", 0.5));
    chorusBox.appendChild(createLever("MODE", "mode")); // Switch

    controls.appendChild(chorusBox);

    container.appendChild(controls);

    // Power (Toggle)
    const powerWrap = document.createElement('div');
    powerWrap.style.cssText = "position: absolute; right: 30px; top: 20px; display: flex; align-items: center; gap: 15px;";

    const light = document.createElement('div');
    light.style.cssText = "width: 10px; height: 10px; background: #d00; border-radius: 50%; box-shadow: 0 0 5px #d00;";

    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 30px; height: 15px; background: #999; border-radius: 2px; cursor: pointer; border: 1px solid #000; position: relative;";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 15px; height: 15px; background: #333; position: absolute; left: 15px; transition: left 0.1s;";
    toggle.appendChild(sw);

    let isBypassed = false;
    toggle.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        if (isBypassed) {
            light.style.background = "#300";
            light.style.boxShadow = "none";
            sw.style.left = "0px";
        } else {
            light.style.background = "#d00";
            light.style.boxShadow = "0 0 5px #d00";
            sw.style.left = "15px";
        }
    });

    powerWrap.appendChild(light);
    powerWrap.appendChild(toggle);
    container.appendChild(powerWrap);

    return container;
}
