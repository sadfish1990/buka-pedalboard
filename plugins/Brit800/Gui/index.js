// Brit800 GUI - JCM800 Gold Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #d4af37; /* Gold */
        background: linear-gradient(to bottom, #d4af37 0%, #b8860b 100%);
        width: 500px;
        height: 220px;
        border: 4px solid #111;
        border-radius: 4px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Helvetica', sans-serif;
        color: #111;
        position: relative;
    `;

    // Logo
    const brand = document.createElement('div');
    brand.innerHTML = "Marshall";
    brand.style.cssText = `
        font-family: 'Brush Script MT', cursive; 
        font-size: 35px; color: #fff; 
        position: absolute; top: 15px; left: 30px;
        text-shadow: 2px 2px 2px #000;
        transform: rotate(-5deg);
    `;
    container.appendChild(brand);

    const sub = document.createElement('div');
    sub.innerHTML = "JCM 800 LEAD SERIES";
    sub.style.cssText = "font-size: 10px; font-weight: bold; position: absolute; top: 60px; left: 40px;";
    container.appendChild(sub);

    // Controls Container
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; gap: 25px; margin-top: 70px; align-items: start;";

    // Classic Knob Factory
    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background: #111;
            position: relative; cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        `;

        // Brown Cap
        const cap = document.createElement('div');
        cap.style.cssText = `
            width: 26px; height: 26px; border-radius: 50%;
            background: #b8860b; 
            position: absolute; top: 7px; left: 7px;
        `;
        knob.appendChild(cap);

        // Line
        const line = document.createElement('div');
        line.style.cssText = `
            width: 2px; height: 16px; background: #fff;
            position: absolute; top: 2px; left: 19px;
            transform-origin: bottom center;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 10px; font-weight: bold; margin-top: 5px;";

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
    // JCM800 Layout: Presence, Bass, Middle, Treble, Master, Pre-Amp
    // (Right to Left usually on physical, but we'll do L->R for screen)
    // Actually JCM800 is: Presence | Bass | Middle | Treble | Master | Pre-Amp
    // Let's standard L->R signal flow: Pre -> EQ -> Master -> Presence?
    // Physical Amp maps well to: Gain, Bass, Mid, Treble, Master, Presence.

    controls.appendChild(createKnob("PRE-AMP", "gain", 0.5));
    controls.appendChild(createKnob("MASTER", "master", 0.5));
    controls.appendChild(createKnob("TREBLE", "treble", 0.5));
    controls.appendChild(createKnob("MIDDLE", "mid", 0.5));
    controls.appendChild(createKnob("BASS", "bass", 0.5));
    controls.appendChild(createKnob("PRESENCE", "presence", 0.5));

    container.appendChild(controls);

    // Power Section (Switch)
    const powerWrap = document.createElement('div');
    powerWrap.style.cssText = "position: absolute; right: 30px; top: 30px; display: flex; align-items: center; gap: 10px;";

    const light = document.createElement('div');
    light.style.cssText = "width: 15px; height: 15px; background: #d00; border-radius: 2px; box-shadow: 0 0 10px #d00; border: 1px solid #500;";

    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 15px; height: 25px; background: #111; border: 1px solid #555; cursor: pointer; display: flex; align-items: center; justify-content: center;";
    const spot = document.createElement('div');
    spot.style.cssText = "width: 5px; height: 5px; background: #fff; border-radius: 50%;";
    toggle.appendChild(spot);

    let isBypassed = false;
    toggle.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        if (isBypassed) {
            light.style.background = "#300";
            light.style.boxShadow = "none";
            spot.style.background = "#555";
        } else {
            light.style.background = "#d00";
            light.style.boxShadow = "0 0 10px #d00";
            spot.style.background = "#fff";
        }
    });

    powerWrap.appendChild(light);
    powerWrap.appendChild(toggle);
    container.appendChild(powerWrap);

    return container;
}
