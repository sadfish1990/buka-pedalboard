// RectoDual GUI - Diamond Plate
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: repeating-linear-gradient(
            45deg,
            #999,
            #999 10px,
            #888 10px,
            #888 20px
        ); /* Faux Diamond Plate */
        background-color: #aaa;
        width: 550px;
        height: 220px;
        border: 4px solid #111;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #111;
        position: relative;
    `;

    // Better Diamond Plate Pattern via CSS radial gradient
    container.style.backgroundImage = `
        radial-gradient(black 15%, transparent 16%),
        radial-gradient(black 15%, transparent 16%)`;
    container.style.backgroundSize = "20px 20px";
    container.style.backgroundPosition = "0 0, 10px 10px";
    container.style.backgroundColor = "#c0c0c0";

    // Dark Vent strip at bottom (or top?)
    // Recto usually has controls on Diamond Plate.

    // Logo Plate
    const plate = document.createElement('div');
    plate.style.cssText = `
        position: absolute; top: 15px; left: 30px;
        background: #000; padding: 5px 15px;
        border: 2px solid #555; border-radius: 2px;
    `;
    const brand = document.createElement('div');
    brand.innerHTML = "MESA/BOOGIE";
    brand.style.cssText = "color: #ddd; font-weight: bold; font-size: 18px; letter-spacing: 2px;";
    plate.appendChild(brand);

    const sub = document.createElement('div');
    sub.innerHTML = "DUAL RECTIFIER";
    sub.style.cssText = "color: #aaa; font-size: 8px; text-align: center; letter-spacing: 1px; margin-top: 2px;";
    plate.appendChild(sub);
    container.appendChild(plate);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; gap: 20px; margin-top: 70px; align-items: start; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 4px;"; // Backing for visibility

    // Domed Knob Factory
    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #444, #000);
            position: relative; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        `;

        // Indicator
        const line = document.createElement('div');
        line.style.cssText = `
            width: 2px; height: 16px; background: #fff;
            position: absolute; top: 2px; left: 19px;
            transform-origin: bottom center;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 5px; color: #ddd;";

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

    // Toggle Switch (Vintage/Modern)
    const createToggle = (label, param) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center;";

        const sw = document.createElement('div');
        sw.style.cssText = "width: 15px; height: 30px; background: #silver; border: 2px solid #555; background: #999; cursor: pointer; position: relative;";

        const handle = document.createElement('div');
        handle.style.cssText = "width: 11px; height: 15px; background: #222; position: absolute; top: 0px; left: 0px; transition: top 0.1s;";
        sw.appendChild(handle);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 8px; font-weight: bold; margin-top: 5px; color: #ddd; text-align: center;";

        let state = 1; // Default Modern

        sw.addEventListener('click', () => {
            state = 1 - state;
            handle.style.top = state ? "0px" : "15px"; // Up=Modern
            plugin.audioNode.setParamValue(param, state);
            lbl.innerText = state ? "MODERN" : "VINTAGE";
        });

        wrap.appendChild(sw);
        wrap.appendChild(lbl);
        return wrap;
    };

    controls.appendChild(createKnob("GAIN", "gain", 0.5));
    controls.appendChild(createKnob("BASS", "bass", 0.5));
    controls.appendChild(createKnob("MID", "mid", 0.5));
    controls.appendChild(createKnob("TREBLE", "treble", 0.5));
    controls.appendChild(createKnob("PRESENCE", "presence", 0.5));
    controls.appendChild(createKnob("MASTER", "master", 0.5));
    controls.appendChild(createToggle("MODE", "mode"));

    container.appendChild(controls);

    // Power (Big Red Rocker)
    const powerWrap = document.createElement('div');
    powerWrap.style.cssText = "position: absolute; right: 30px; top: 30px; display: flex; align-items: center; gap: 10px;";

    const light = document.createElement('div');
    light.style.cssText = "width: 20px; height: 20px; background: #f00; border-radius: 50%; box-shadow: 0 0 15px #f00; border: 2px solid #500;";

    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 20px; height: 35px; background: #300; border: 2px solid #000; cursor: pointer;";
    const rock = document.createElement('div');
    rock.style.cssText = "width: 100%; height: 50%; background: #d00; transition: margin-top 0.1s;";
    toggle.appendChild(rock);

    let isBypassed = false;
    toggle.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        if (isBypassed) {
            light.style.background = "#300";
            light.style.boxShadow = "none";
            rock.style.marginTop = "17px"; // Down
            rock.style.background = "#500";
        } else {
            light.style.background = "#f00";
            light.style.boxShadow = "0 0 15px #f00";
            rock.style.marginTop = "0px"; // Up
            rock.style.background = "#d00";
        }
    });

    powerWrap.appendChild(light);
    powerWrap.appendChild(toggle);
    container.appendChild(powerWrap);

    return container;
}
