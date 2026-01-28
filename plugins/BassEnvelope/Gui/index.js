// BassEnvelope GUI - Silver/Blue Funk (Refined)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #e6e6fa, #d0d0e0); /* Metallic Blue-ish Silver */
        width: 250px;
        height: 430px; /* Taller to fit footer */
        border-radius: 12px;
        border: 2px solid #99a;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        user-select: none;
        font-family: 'Verdana', sans-serif;
        color: #003366; /* Navy Blue */
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "BassEnvelope";
    title.style.cssText = "font-size: 24px; font-weight: bold; margin-bottom: 5px; font-style: italic;";
    container.appendChild(title);

    const sub = document.createElement('div');
    sub.innerHTML = "DYNAMIC FILTER";
    sub.style.cssText = "font-size: 10px; font-weight: bold; margin-bottom: 40px; letter-spacing: 1px;";
    container.appendChild(sub);

    // Controls
    // Sensitivity (Big), Decay (Small)

    // Logic for Knobs
    const setupKnob = (el, line, param, def, scale = 1.0) => {
        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            line.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);
        };

        let isDrag = false;
        let startY = 0;

        el.addEventListener('pointerdown', e => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            isDrag = true; startY = e.clientY; el.setPointerCapture(e.pointerId);
        });
        el.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            const delta = (startY - e.clientY) * 0.005 * scale;
            update(val + delta);
            startY = e.clientY;
        });
        el.addEventListener('pointerup', e => {
            e.stopPropagation(); isDrag = false; el.releasePointerCapture(e.pointerId);
        });
        update(def);
    };

    // Sensitivity
    const sensWrap = document.createElement('div');
    sensWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;";

    const bigKnob = document.createElement('div');
    bigKnob.style.cssText = `
        width: 80px; height: 80px; border-radius: 50%;
        background: #eee; border: 4px solid #003366;
        position: relative; cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    const bigLine = document.createElement('div');
    bigLine.style.cssText = `width: 6px; height: 40%; background: #003366; position: absolute; top: 10px; left: 50%; margin-left: -3px; transform-origin: bottom center; border-radius: 3px;`;
    bigKnob.appendChild(bigLine);

    const bigLbl = document.createElement('div');
    bigLbl.innerText = "SENSITIVITY";
    bigLbl.style.marginTop = "10px"; bigLbl.style.fontWeight = "bold"; bigLbl.style.fontSize = "12px";

    setupKnob(bigKnob, bigLine, "sens", 0.5);
    sensWrap.appendChild(bigKnob);
    sensWrap.appendChild(bigLbl);
    container.appendChild(sensWrap);

    // Decay
    const decayWrap = document.createElement('div');
    decayWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;";

    const smallKnob = document.createElement('div');
    smallKnob.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: #eee; border: 2px solid #003366;
        position: relative; cursor: pointer;
    `;
    const smallLine = document.createElement('div');
    smallLine.style.cssText = `width: 3px; height: 40%; background: #003366; position: absolute; top: 5px; left: 50%; margin-left: -1.5px; transform-origin: bottom center;`;
    smallKnob.appendChild(smallLine);

    const smallLbl = document.createElement('div');
    smallLbl.innerText = "RESPONSE";
    smallLbl.style.marginTop = "10px"; smallLbl.style.fontWeight = "bold"; smallLbl.style.fontSize = "10px";

    setupKnob(smallKnob, smallLine, "decay", 0.5);
    decayWrap.appendChild(smallKnob);
    decayWrap.appendChild(smallLbl);
    container.appendChild(decayWrap);

    // Distortion Switch
    const switchWrap = document.createElement('div');
    switchWrap.style.marginTop = "auto";
    switchWrap.style.marginBottom = "20px";

    const toggle = document.createElement('div');
    toggle.style.cssText = `
        width: 100px; height: 30px; 
        border: 2px solid #cc0000; border-radius: 15px; 
        display: flex; align-items: center; justify-content: center; 
        cursor: pointer; color: #cc0000; font-weight: bold; font-size: 11px;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        background: rgba(255,255,255,0.5);
    `;
    toggle.innerText = "DIST OFF";

    let isDist = false;
    const updateDist = () => {
        if (isDist) {
            toggle.style.background = "#cc0000";
            toggle.style.color = "white";
            toggle.innerText = "DIST ON";
            toggle.style.boxShadow = "0 0 10px #cc0000";
        } else {
            toggle.style.background = "rgba(255,255,255,0.5)";
            toggle.style.color = "#cc0000";
            toggle.innerText = "DIST OFF";
            toggle.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
        }
    };

    toggle.addEventListener('click', () => {
        isDist = !isDist;
        updateDist();
        plugin.audioNode.setParamValue('dist', isDist ? 1 : 0);
    });

    switchWrap.appendChild(toggle);
    container.appendChild(switchWrap);

    // Bypass Foot
    const footer = document.createElement('div');
    footer.style.marginBottom = "5px";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #777; cursor: pointer; margin: 0 auto;";

    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 0 auto 5px auto; box-shadow: 0 0 5px #f00;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#888" : "#f00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 5px #f00";
    });

    footer.appendChild(led);
    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
