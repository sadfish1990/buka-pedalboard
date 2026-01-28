// TubeWarmth GUI - Steampunk/Industrial
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #2a2a2a;
        width: 320px;
        height: 520px; /* Increased height for selector */
        border-radius: 4px;
        border: 4px solid #b87333; /* Copper */
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Courier New', monospace;
        color: #d4af37; /* Brass */
    `;

    // Grille / Window
    const grille = document.createElement('div');
    grille.style.cssText = `
        width: 200px; height: 120px;
        background: radial-gradient(circle, #442200, #110800);
        border: 4px inset #555;
        border-radius: 10px;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;
        box-shadow: inset 0 0 20px #ff6600;
    `;

    // Filament Glow (Animated purely CSS)
    const glow = document.createElement('div');
    glow.style.cssText = `
        width: 100%; height: 100%;
        background: radial-gradient(circle at 50% 50%, rgba(255,100,0,0.6), transparent 70%);
        animation: flicker 0.1s infinite alternate;
    `;

    // Inject animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flicker {
            from { opacity: 0.8; }
            to { opacity: 1.0; }
        }
    `;
    container.appendChild(style);

    grille.appendChild(glow);

    // Tube Silhouette
    const silhouette = document.createElement('div');
    silhouette.innerHTML = `
        <svg width="200" height="120" style="position:absolute; top:0; left:0;">
            <path d="M80,120 L80,20 C80,5 120,5 120,20 L120,120" stroke="#f0f0f0" stroke-width="2" fill="none" opacity="0.3"/>
            <rect x="90" y="40" width="20" height="60" fill="#333" opacity="0.8"/>
        </svg>
    `;
    grille.appendChild(silhouette);
    container.appendChild(grille);

    // Title
    const title = document.createElement('div');
    title.innerHTML = "VALVE PREAMP";
    title.style.cssText = "font-size: 24px; font-weight: bold; margin-bottom: 25px; letter-spacing: 2px; color: #b87333; text-shadow: 0 2px 4px #000;";
    container.appendChild(title);

    // Switches Row for Type (NEW SELECTOR)
    const switchWrap = document.createElement('div');
    switchWrap.style.cssText = "margin-bottom: 30px; display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%;";

    const swLabel = document.createElement('div');
    swLabel.textContent = "TUBE MODEL";
    swLabel.style.fontSize = "12px";
    switchWrap.appendChild(swLabel);

    // Custom Selector Display
    const selector = document.createElement('div');
    selector.style.cssText = `
        display: flex; background: #111; border: 2px solid #555; 
        border-radius: 4px; overflow: hidden; width: 280px;
    `;

    const options = ["12AX7", "12AT7", "EL84", "6L6"];
    const buttons = [];

    const updateUI = (activeIdx) => {
        buttons.forEach((b, i) => {
            if (i === activeIdx) {
                b.style.background = "#b87333"; // Copper
                b.style.color = "#111"; // Black text
                b.style.boxShadow = "inset 0 0 10px rgba(0,0,0,0.5)";
            } else {
                b.style.background = "#1a1a1a";
                b.style.color = "#666";
                b.style.boxShadow = "none";
            }
        });
    };

    options.forEach((opt, idx) => {
        const btn = document.createElement('div');
        btn.textContent = opt;
        btn.style.cssText = `
            flex: 1; text-align: center; padding: 6px 0; font-size: 11px; font-weight: bold;
            cursor: pointer; border-right: 1px solid #333; color: #666; background: #1a1a1a;
            transition: all 0.2s;
        `;
        if (idx === options.length - 1) btn.style.borderRight = "none";

        btn.addEventListener('click', () => {
            // 0=0..0.25, 1=0.25..0.5, etc.
            const val = (idx * 0.25) + 0.1;
            plugin.audioNode.setParamValue('type', val);
            updateUI(idx);
        });

        buttons.push(btn);
        selector.appendChild(btn);
    });

    // Initialize default (12AX7 = index 0)
    updateUI(0);

    switchWrap.appendChild(selector);
    container.appendChild(switchWrap);


    // Knobs
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; gap: 20px; justify-content: center; width: 100%; margin-bottom: 40px;";

    const createKnob = (label, param, def) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%;
            background: conic-gradient(#333 0%, #111 100%);
            border: 2px solid #b87333;
            position: relative; cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.8);
        `;

        const line = document.createElement('div');
        line.style.cssText = `
            width: 4px; height: 40%; background: #d4af37;
            position: absolute; top: 5px; left: 50%; margin-left: -2px;
            transform-origin: bottom center; border-radius: 2px;
        `;
        knob.appendChild(line);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.marginTop = "10px";
        lbl.style.fontWeight = "bold";
        lbl.style.color = "#d4af37";

        let val = def;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            line.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);
        };

        // Grab logic with Stop Propagation REINFORCED
        let isDrag = false;
        let startY = 0;

        knob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
            isDrag = true;
            startY = e.clientY;
            knob.setPointerCapture(e.pointerId);
        });

        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
            const delta = (startY - e.clientY) * 0.005;
            update(val + delta);
            startY = e.clientY;
        });

        knob.addEventListener('pointerup', e => {
            e.stopPropagation();
            isDrag = false;
            knob.releasePointerCapture(e.pointerId);
        });

        update(def);
        wrap.appendChild(knob);
        wrap.appendChild(lbl);
        return wrap;
    };

    knobsRow.appendChild(createKnob("GAIN", "gain", 0.5));
    knobsRow.appendChild(createKnob("BIAS", "bias", 0.0));
    knobsRow.appendChild(createKnob("MASTER", "level", 0.5));

    container.appendChild(knobsRow);

    // Bypass
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center;";

    const sw = document.createElement('div');
    sw.style.cssText = "width: 50px; height: 50px; background: radial-gradient(#888, #444); border-radius: 50%; border: 4px solid #b87333; cursor: pointer; box-shadow: 0 5px 10px #000;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        // Dim the tube glow
        glow.style.opacity = isBypassed ? "0.1" : "0.8";
        glow.style.animation = isBypassed ? "none" : "flicker 0.1s infinite alternate";
    });

    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
