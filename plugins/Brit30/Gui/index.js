// Brit30 GUI - Diamond Grille Cloth & Refined Knobs
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.setAttribute("translate", "no"); // Prevent auto-translation corrupting labels
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #2b1d1d; /* Dark Brown base */
        width: 500px;
        height: 220px;
        border: 4px solid #111;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Times New Roman', serif;
        color: #fff;
        position: relative;
    `;

    // Grille Cloth Pattern (Diamond) via CSS
    container.style.backgroundImage = `
        repeating-linear-gradient(45deg, transparent, transparent 19px, #522 20px),
        repeating-linear-gradient(-45deg, transparent, transparent 19px, #522 20px)
    `;
    container.style.backgroundColor = "#2b1d1d";

    // Top Panel (Control Plate)
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; height: 100px;
        background: #602020; /* Vox Red */
        border-bottom: 4px solid #bba550; /* Gold piping */
        display: flex; justify-content: center; align-items: center;
        padding-top: 10px; gap: 25px;
    `;
    container.appendChild(panel);

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = "VOX";
    logo.style.cssText = "position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); font-weight: bold; font-size: 50px; color: #d4af37; text-shadow: 2px 2px 0 #000; letter-spacing: 5px;";
    container.appendChild(logo);

    // Improved Chicken Head Knob Factory
    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        // Knob Container (Rotates)
        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 40px; height: 40px; 
            position: relative; cursor: pointer;
        `;

        // The "Head" (Composite Shape)
        // 1. Center Dome
        const dome = document.createElement('div');
        dome.style.cssText = `
            position: absolute; width: 22px; height: 22px;
            left: 9px; top: 9px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #511, #200);
            box-shadow: 0 2px 4px rgba(0,0,0,0.6);
            z-index: 2;
        `;

        // 2. The Beak (Pointer)
        const beak = document.createElement('div');
        beak.style.cssText = `
            position: absolute; width: 8px; height: 25px;
            left: 16px; top: 0px; 
            background: #311;
            border-radius: 4px;
            background: linear-gradient(to right, #411, #200);
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            z-index: 1;
        `;

        // 3. Indicator Line white
        const line = document.createElement('div');
        line.style.cssText = `
            position: absolute; width: 2px; height: 18px;
            left: 19px; top: 2px;
            background: #fff;
            border-radius: 2px;
            z-index: 3;
            opacity: 0.8;
        `;

        knob.appendChild(beak);
        knob.appendChild(dome);
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 9px; font-weight: bold; margin-top: 0px; color: #ffd700;";

        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            knob.style.transform = `rotate(${deg}deg)`;
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

    panel.appendChild(createKnob("VOLUME", "gain", 0.5));
    panel.appendChild(createKnob("TREBLE", "treble", 0.5));
    panel.appendChild(createKnob("BASS", "bass", 0.5));
    panel.appendChild(createKnob("CUT", "cut", 0.0));
    panel.appendChild(createKnob("MASTER", "master", 0.5));

    // Power Toggle
    const powerWrap = document.createElement('div');
    powerWrap.style.cssText = "position: absolute; right: 20px; top: 120px; display: flex; align-items: center; gap: 10px;";

    const light = document.createElement('div');
    light.style.cssText = "width: 12px; height: 12px; background: #f00; border-radius: 50%; box-shadow: 0 0 10px #f00; border: 1px solid #aaa;";

    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 10px; height: 20px; background: #silver; border: 1px solid #000; cursor: pointer;";
    const lever = document.createElement('div');
    lever.style.cssText = "width: 100%; height: 50%; background: #fff; margin-top: 0;";
    toggle.appendChild(lever);

    let isBypassed = false;
    toggle.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        if (isBypassed) {
            light.style.background = "#300";
            light.style.boxShadow = "none";
            lever.style.marginTop = "10px";
        } else {
            light.style.background = "#f00";
            light.style.boxShadow = "0 0 10px #f00";
            lever.style.marginTop = "0px";
        }
    });

    powerWrap.appendChild(light);
    powerWrap.appendChild(toggle);
    container.appendChild(powerWrap);

    return container;
}
