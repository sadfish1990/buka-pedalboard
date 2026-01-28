// RotarySpeaker GUI - Wood Cabinet (Continuous Speed Edition)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #3e2723; /* Dark Wood */
        width: 320px;
        height: 420px;
        border-radius: 4px;
        border: 8px solid #1a100c; /* Trim */
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Times New Roman', serif;
        color: #ffca28; /* Gold */
    `;

    // Grille Cloth Pattern
    const grille = document.createElement('div');
    grille.style.cssText = `
        width: 280px; height: 120px;
        background: repeating-linear-gradient(45deg, #2e1e1a 0, #2e1e1a 2px, #3e2723 2px, #3e2723 4px);
        border: 2px inset #111;
        margin-bottom: 20px;
        position: relative;
    `;

    // Spinning Horn Visual
    const horn = document.createElement('div');
    horn.style.cssText = `
        width: 80px; height: 20px; background: #222; 
        position: absolute; top: 50px; left: 100px;
        border-radius: 4px; transform-origin: center;
        box-shadow: 0 5px 10px rgba(0,0,0,0.5);
    `;
    // Add "bells"
    const bell1 = document.createElement('div');
    bell1.style.cssText = "width:30px; height:30px; background:#111; border-radius:50%; position:absolute; left:-10px; top:-5px;";
    horn.appendChild(bell1);

    grille.appendChild(horn);
    container.appendChild(grille);

    // Animation Logic
    let rotation = 0;
    let speedVal = 2; // Visual speed
    const animate = () => {
        // Simple rotation based on last known speed
        rotation += speedVal;
        horn.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Title Badge
    const badge = document.createElement('div');
    badge.innerHTML = "LESLIE 147";
    badge.style.cssText = `
        background: #ffca28; color: #000; padding: 5px 15px; 
        font-weight: bold; border-radius: 2px; margin-bottom: 40px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    `;
    container.appendChild(badge);

    // Knobs Row
    // We replace the lever with a 3-knob layout: Speed, Drive, Balance
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; gap: 20px; justify-content: center; width: 100%;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%;
            background: #111; border: 2px solid #ffca28;
            position: relative; cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 3px; height: 40%; background: #ffca28;
            position: absolute; top: 5px; left: 50%; margin-left: -1.5px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "10px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "12px";

        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            line.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);

            // Visual feedback
            if (param === 'speed') {
                // Map 0-1 to rotation speed 1..25
                speedVal = 1 + (val * 24);
            }
        };

        // Drag logic with STOP PROPAGATION
        let isDrag = false;
        let startY = 0;

        knob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
            isDrag = true; startY = e.clientY; knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
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

    knobsRow.appendChild(createKnob("SPEED", "speed", 0.3)); // Continuous Knob
    knobsRow.appendChild(createKnob("DRIVE", "drive", 0.2));
    knobsRow.appendChild(createKnob("BALANCE", "balance", 0.5));

    container.appendChild(knobsRow);

    // Bypass Footer
    const footer = document.createElement('div');
    footer.style.marginTop = "20px";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #333; cursor: pointer;";
    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 0 auto 5px auto; box-shadow: 0 0 5px #f00;";

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
