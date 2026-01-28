// MemoryBrigade GUI - Silver Box (3-Mode Edition)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #e0e0e0; /* Silver */
        width: 380px; /* Wide box */
        height: 300px;
        border-radius: 4px;
        border: 2px solid #999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial', sans-serif;
        color: #111;
        position: relative;
    `;

    // Graphics Overlay (Strips)
    const decor = document.createElement('div');
    decor.style.cssText = `
        position: absolute; top:0; left:0; width:100%; height:100%; pointer-events: none;
        background: 
            linear-gradient(135deg, transparent 40%, rgba(0,0,150,0.1) 40%, rgba(0,0,150,0.1) 60%, transparent 60%),
            linear-gradient(135deg, transparent 60%, rgba(200,0,0,0.1) 60%, rgba(200,0,0,0.1) 80%, transparent 80%);
    `;
    container.appendChild(decor);

    // Title
    const title = document.createElement('div');
    title.innerHTML = "MemoryBrigade";
    title.style.cssText = "font-size: 28px; font-weight: bold; margin-bottom: 5px; font-family: 'Georgia', serif; z-index:1;";
    container.appendChild(title);

    const sub = document.createElement('div');
    sub.innerHTML = "ECHO &nbsp; CHORUS &nbsp; VIBRATO";
    sub.style.cssText = "font-size: 10px; font-weight: bold; margin-bottom: 30px; letter-spacing: 2px; z-index:1;";
    container.appendChild(sub);

    // Controls Layout
    const controlsArea = document.createElement('div');
    controlsArea.style.cssText = "display: flex; gap: 15px; z-index: 1;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 45px; height: 45px; border-radius: 50%;
            background: #222; border: 2px solid #ccc;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 2px; height: 40%; background: #fff;
            position: absolute; top: 5px; left: 50%; margin-left: -1px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "8px";
        lbl.style.fontWeight = "bold";
        lbl.style.fontSize = "10px";

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

    controlsArea.appendChild(createKnob("LEVEL", "level", 0.8));
    controlsArea.appendChild(createKnob("BLEND", "blend", 0.5));
    controlsArea.appendChild(createKnob("F.BACK", "feedback", 0.3));
    controlsArea.appendChild(createKnob("DELAY", "delay", 0.5));
    controlsArea.appendChild(createKnob("DEPTH", "depth", 0.2));

    container.appendChild(controlsArea);

    // Switch (Chorus/Off/Vibrato)
    const swWrap = document.createElement('div');
    swWrap.style.marginTop = "25px";
    swWrap.style.display = "flex";
    swWrap.style.flexDirection = "column";
    swWrap.style.alignItems = "center";
    swWrap.style.zIndex = "1";

    const swLabel = document.createElement('div');
    swLabel.innerHTML = "CHOR - OFF - VIB";
    swLabel.style.fontSize = "9px";
    swLabel.style.fontWeight = "bold";

    // Wider track for 3 positions
    const toggle = document.createElement('div');
    toggle.style.cssText = "width: 60px; height: 15px; background: #333; margin-top:5px; position:relative; cursor:pointer;";
    const lever = document.createElement('div');
    lever.style.cssText = "width: 20px; height: 15px; background: #888; position:absolute; left:0; transition: left 0.1s;";
    toggle.appendChild(lever);

    // 0=Chorus, 1=Off, 2=Vibrato
    let modMode = 0;

    const updateSwitch = () => {
        // Positions: 0px, 20px, 40px
        lever.style.left = (modMode * 20) + "px";
        plugin.audioNode.setParamValue('type', modMode);
    };

    toggle.addEventListener('click', () => {
        modMode++;
        if (modMode > 2) modMode = 0;
        updateSwitch();
    });

    updateSwitch(); // Init

    swWrap.appendChild(swLabel);
    swWrap.appendChild(toggle);
    container.appendChild(swWrap);

    // Bypass
    const footer = document.createElement('div');
    footer.style.zIndex = "1";
    footer.style.marginTop = "20px";
    footer.style.display = "flex";
    footer.style.flexDirection = "column";
    footer.style.alignItems = "center";

    const fsw = document.createElement('div');
    fsw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #333; cursor: pointer;";
    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 0 auto 5px auto; box-shadow: 0 0 5px #f00;";

    let isBypassed = false;
    fsw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#333" : "#f00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 5px #f00";
    });

    footer.appendChild(led);
    footer.appendChild(fsw);
    container.appendChild(footer);

    return container;
}
