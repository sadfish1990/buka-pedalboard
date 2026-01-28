// BlackPanel GUI - '65 Blackface Style (With Power Switch)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #111; /* Black Faceplate */
        width: 500px;
        height: 200px;
        border: 2px solid #ccc; /* Chassis edge */
        border-top: 15px solid #222; /* Top lip */
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Times New Roman', serif; /* Vintage serif */
        color: #fff;
        position: relative;
    `;

    // Logo
    const brand = document.createElement('div');
    brand.innerHTML = "<span style='font-style:italic; font-size:20px; font-family:cursive;'>Fender</span> <span style='font-size:10px; letter-spacing:1px; font-family:sans-serif;'>TWIN REVERB</span>";
    brand.style.cssText = "position: absolute; top: 15px; left: 30px;";
    container.appendChild(brand);

    // Controls Container
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; gap: 20px; margin-top: 60px; align-items: start;";

    // Skirted Knob Factory
    const createKnob = (label, param, def, maxVal = 10) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        // Create skirt
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: #111; /* Skirt color */
            position: relative; cursor: pointer;
        `;

        // Numbers on skirt
        for (let i = 0; i < 10; i++) {
            const angle = -135 + (i * 27); // Span 270 deg
            const rad = angle * (Math.PI / 180);
            const num = document.createElement('div');
            num.innerText = i + 1;
            num.style.cssText = `
                position: absolute; color: #fff; font-size: 8px; font-family: sans-serif;
                left: 50%; top: 50%; 
                transform: translate(-50%, -50%) rotate(${angle}deg) translateY(-22px);
            `;
            knob.appendChild(num);
        }

        // Chrome Top
        const cap = document.createElement('div');
        cap.style.cssText = `
            width: 30px; height: 30px; border-radius: 50%;
            background: linear-gradient(135deg, #eee, #999);
            position: absolute; top: 10px; left: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        `;
        knob.appendChild(cap);

        // Indicator Line
        const line = document.createElement('div');
        line.style.cssText = `
            width: 2px; height: 15px; background: #333;
            position: absolute; top: 0; left: 14px;
            transform-origin: bottom center;
        `;
        cap.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 10px; font-weight: bold; margin-top: 5px; font-family: sans-serif;";

        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            cap.style.transform = `rotate(${deg}deg)`;
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

    // Switch
    const createSwitch = (label, param) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;";

        const sw = document.createElement('div');
        sw.style.cssText = "width: 15px; height: 30px; background: #silver; border: 2px solid #555; background: #ccc; cursor: pointer; position: relative;";

        const handle = document.createElement('div');
        handle.style.cssText = "width: 11px; height: 11px; background: #111; position: absolute; top: 2px; left: 2px; transition: top 0.1s;";
        sw.appendChild(handle);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; margin-top: 5px; font-family: sans-serif;";

        let state = false;
        sw.addEventListener('click', () => {
            state = !state;
            handle.style.top = state ? "15px" : "2px";
            plugin.audioNode.setParamValue(param, state ? 1 : 0);
        });

        wrap.appendChild(sw);
        wrap.appendChild(lbl);
        return wrap;
    };

    // Layout
    controls.appendChild(createSwitch("BRIGHT", "bright"));
    controls.appendChild(createKnob("VOLUME", "vol", 0.3));
    controls.appendChild(createKnob("TREBLE", "treble", 0.5));
    controls.appendChild(createKnob("MIDDLE", "mid", 0.5));
    controls.appendChild(createKnob("BASS", "bass", 0.5));
    controls.appendChild(createKnob("REVERB", "reverb", 0.2));

    container.appendChild(controls);

    // Power Section (Jewel + Switch)
    const powerWrap = document.createElement('div');
    powerWrap.style.cssText = "position: absolute; right: 30px; top: 25px; display: flex; align-items: center; gap: 15px;";

    // Pilot Light (Jewel)
    const jewel = document.createElement('div');
    jewel.style.cssText = `
        width: 15px; height: 15px; border-radius: 50%;
        background: radial-gradient(#f00, #500);
        box-shadow: 0 0 10px #f00;
        border: 2px solid #aaa;
    `;

    // Toggle Switch (Metal)
    const toggle = document.createElement('div');
    toggle.style.cssText = `
        width: 12px; height: 25px; background: #silver;
        background: linear-gradient(to right, #999, #fff, #999);
        border: 1px solid #666; border-radius: 2px;
        cursor: pointer; position: relative;
    `;
    const lever = document.createElement('div');
    lever.style.cssText = `
        width: 16px; height: 16px; background: #ddd; border-radius: 50%;
        position: absolute; left: -2px; top: -5px; 
        box-shadow: 0 2px 2px rgba(0,0,0,0.5);
        transition: top 0.1s;
    `;
    toggle.appendChild(lever);

    // Label for power
    const onLbl = document.createElement('div');
    onLbl.innerText = "ON";
    onLbl.style.cssText = "position: absolute; top: -15px; left: -2px; font-size: 8px; font-weight: bold;";
    toggle.appendChild(onLbl);

    // Logic
    let isBypassed = false;

    // Initial state: ON (Lever Up)
    lever.style.top = "-5px";

    toggle.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);

        if (isBypassed) {
            // OFF State
            jewel.style.background = "#300";
            jewel.style.boxShadow = "none";
            lever.style.top = "15px"; // Down
        } else {
            // ON State
            jewel.style.background = "radial-gradient(#f00, #500)";
            jewel.style.boxShadow = "0 0 10px #f00";
            lever.style.top = "-5px"; // Up
        }
    });

    powerWrap.appendChild(jewel);
    powerWrap.appendChild(toggle);
    container.appendChild(powerWrap);

    return container;
}
