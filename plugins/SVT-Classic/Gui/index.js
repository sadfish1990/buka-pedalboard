// SVT-Classic GUI - Silver Faceplate (Final Fix)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #e0e0e0; /* Lighter Silver */
        border-top: 10px solid #222; 
        border-bottom: 20px solid #111;
        width: 600px;
        height: 250px;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #111;
        position: relative; /* Context for absolute positioning */
    `;

    // Branding - Explicit styling to prevent double-text artifacts
    const brand = document.createElement('div');
    brand.innerHTML = "<span style='font-weight:900; font-size:24px; letter-spacing:-1px;'>SVT</span> <span style='font-size:12px; font-weight:bold;'>CLASSIC</span>";
    brand.style.cssText = "position: absolute; top: 15px; left: 30px; color: #000; text-shadow: none; z-index: 5;";
    container.appendChild(brand);

    // Controls Row
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; gap: 20px; margin-top: 50px; align-items: start;";

    // Helper: Knob
    const createKnob = (label, param, def, size = 50) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: ${size}px; height: ${size}px; border-radius: 50%;
            background: #111; border: 2px solid #555;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        `;
        const line = document.createElement('div');
        line.style.cssText = `width: 2px; height: 40%; background: #fff; position: absolute; top: 5px; left: 50%; margin-left: -1px; transform-origin: bottom center;`;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 10px; font-weight: bold; margin-top: 8px;";

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

    // Switches
    const createSwitch = (label, param) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center;";

        const sw = document.createElement('div');
        sw.style.cssText = "width: 20px; height: 40px; background: #ddd; border: 2px solid #555; border-radius: 4px; cursor: pointer; position: relative;";
        const handle = document.createElement('div');
        handle.style.cssText = "width: 16px; height: 16px; background: #111; position: absolute; top: 2px; left: 2px; border-radius: 2px; transition: top 0.1s;";
        sw.appendChild(handle);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 5px; text-align: center; white-space: pre-wrap; line-height:1.1;";

        let state = false;
        sw.addEventListener('click', () => {
            state = !state;
            handle.style.top = state ? "20px" : "2px";
            plugin.audioNode.setParamValue(param, state ? 1 : 0);
        });

        wrap.appendChild(sw);
        wrap.appendChild(lbl);
        return wrap;
    };

    // INPUTS
    controls.appendChild(createKnob("GAIN", "gain", 0.5, 60));

    // ULTRA SWITCHES + SLAP
    const switches = document.createElement('div');
    switches.style.cssText = "display: flex; gap: 8px; margin: 0 10px;";
    switches.appendChild(createSwitch("ULTRA\nHI", "uhi"));
    switches.appendChild(createSwitch("SLAP", "slap"));
    switches.appendChild(createSwitch("ULTRA\nLO", "ulo"));
    controls.appendChild(switches);

    // EQ
    controls.appendChild(createKnob("BASS", "bass", 0.5));

    // MID SECTION (Boxed)
    const midWrap = document.createElement('div');
    midWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; background: #c0c0c0; padding: 5px; border-radius: 4px; border: 1px solid #999; box-shadow: inset 0 0 5px rgba(0,0,0,0.1);";
    midWrap.appendChild(createKnob("MID", "mid", 0.5));
    // Freq Switch
    const midSw = document.createElement('div');
    midSw.style.cssText = "font-size: 9px; margin-top: 5px; cursor: pointer; background: #222; color: #eee; padding: 2px 4px; border-radius: 2px; min-width: 35px; text-align:center;";
    midSw.innerText = "800Hz";
    let mf = 1;
    midSw.addEventListener('click', () => {
        mf = (mf + 1) % 3;
        const map = ["220Hz", "800Hz", "3kHz"];
        midSw.innerText = map[mf];
        // 0->0, 1->0.5, 2->1.0
        plugin.audioNode.setParamValue('midfreq', mf * 0.5);
    });
    midWrap.appendChild(midSw);
    controls.appendChild(midWrap);

    controls.appendChild(createKnob("TREBLE", "treble", 0.5));
    controls.appendChild(createKnob("MASTER", "master", 0.7, 60));

    container.appendChild(controls);

    // Power/Bypass (Top Right Corner)
    const footer = document.createElement('div');
    footer.style.position = "absolute";
    footer.style.right = "20px";
    footer.style.top = "20px"; // MOVED WAY UP from 90px
    footer.style.display = "flex";
    footer.style.flexDirection = "column";
    footer.style.alignItems = "center";

    const powerLabel = document.createElement('div');
    powerLabel.innerText = "POWER";
    powerLabel.style.fontSize = "9px";
    powerLabel.style.fontWeight = "bold";
    powerLabel.style.marginBottom = "3px";
    footer.appendChild(powerLabel);

    const light = document.createElement('div');
    light.style.cssText = "width: 20px; height: 30px; background: #800; border: 3px solid #ccc; cursor: pointer; border-radius: 2px; margin-bottom: 5px; position: relative;";

    // Light bulb
    const bulb = document.createElement('div');
    bulb.style.cssText = "width: 100%; height: 50%; background: #f00; transition: background 0.1s; position: absolute; bottom: 0;";
    light.appendChild(bulb);

    let isBypassed = false;
    light.addEventListener('click', () => {
        isBypassed = !isBypassed;
        // Bypassed = Off (Dark, Top half active visually?)
        // Let's toggle appearance
        if (isBypassed) {
            bulb.style.background = "#400"; // Dim
            bulb.style.boxShadow = "none";
            bulb.style.top = "0"; // Button physically toggles up/down visual
            bulb.style.bottom = "auto";
        } else {
            bulb.style.background = "#f00"; // Bright
            bulb.style.boxShadow = "0 0 15px #f00";
            bulb.style.top = "auto";
            bulb.style.bottom = "0";
        }
        plugin.audioNode.setBypass(isBypassed);
    });

    // Init Active
    bulb.style.boxShadow = "0 0 15px #f00";

    footer.appendChild(light);
    container.appendChild(footer);

    return container;
}
