// SmallChorus GUI - Purple Analog Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: url('https://www.transparenttextures.com/patterns/grunge-wall.png'), linear-gradient(180deg, #6a3093 0%, #a044ff 100%);
        background-blend-mode: multiply;
        color: #fff;
        font-family: 'Courier New', monospace;
        border-radius: 4px;
        width: 250px;
        border: 2px solid #4a148c;
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        user-select: none;
    `;

    // Title ("SMALL CHORUS")
    const title = document.createElement('h2');
    title.textContent = "SMALL CHORUS";
    title.style.cssText = `
        margin: 0 0 30px 0; 
        color: #fff; 
        text-align: center; 
        font-weight: bold; 
        letter-spacing: 2px;
        text-shadow: 2px 2px 0px #000;
        border: 2px solid #fff;
        padding: 5px 10px;
    `;
    container.appendChild(title);

    // Controls Container
    const controls = document.createElement('div');
    controls.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 30px; width: 100%;";

    // --- DEPTH SWITCH ---
    const depthWrapper = document.createElement('div');
    depthWrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px;";

    const depthLabel = document.createElement('label');
    depthLabel.textContent = "DEPTH";
    depthLabel.style.cssText = "font-size: 14px; font-weight: bold; text-shadow: 1px 1px 0 #000;";

    // Custom Toggle Switch
    const switchContainer = document.createElement('div');
    switchContainer.style.cssText = `
        width: 60px;
        height: 30px;
        background: #333;
        border-radius: 15px;
        position: relative;
        cursor: pointer;
        border: 2px solid #000;
    `;

    const switchThumb = document.createElement('div');
    switchThumb.style.cssText = `
        width: 24px;
        height: 24px;
        background: #fff;
        border-radius: 50%;
        position: absolute;
        top: 1px;
        left: 3px;
        transition: left 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    `;

    let isHighDepth = false;

    const updateSwitch = (val) => {
        isHighDepth = val > 0.5;
        switchThumb.style.left = isHighDepth ? '31px' : '3px';
        plugin.audioNode.setParamValue('depth', isHighDepth ? 1 : 0);
    };

    const toggleSwitch = (e) => {
        e.stopPropagation();
        updateSwitch(isHighDepth ? 0 : 1);
    };

    switchContainer.addEventListener('click', toggleSwitch);
    switchContainer.addEventListener('mousedown', (e) => e.stopPropagation());
    switchContainer.addEventListener('touchstart', (e) => e.stopPropagation());

    // Switch Text ("LOW / HIGH")
    const switchText = document.createElement('div');
    switchText.style.cssText = "display: flex; justify-content: space-between; width: 70px; font-size: 10px; margin-top: 2px; font-weight: bold;";
    switchText.innerHTML = "<span>LOW</span><span>HIGH</span>";

    switchContainer.appendChild(switchThumb);
    depthWrapper.appendChild(depthLabel);
    depthWrapper.appendChild(switchContainer);
    depthWrapper.appendChild(switchText);
    controls.appendChild(depthWrapper);

    // --- RATE KNOB (BIG) ---
    const rateWrapper = document.createElement('div');
    rateWrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px;";

    const rateLabel = document.createElement('label');
    rateLabel.textContent = "RATE";
    rateLabel.style.cssText = "font-size: 24px; font-weight: bold; text-shadow: 2px 2px 0 #000;";

    const knobSize = 100;
    const knobVisual = document.createElement('div');
    knobVisual.style.cssText = `
        width: ${knobSize}px;
        height: ${knobSize}px;
        border-radius: 50%;
        background: #111;
        border: 4px solid #fff;
        position: relative;
        cursor: pointer;
        box-shadow: 0 5px 15px rgba(0,0,0,0.6);
    `;

    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: absolute;
        width: 6px;
        height: 40px;
        background: #fff;
        top: 5px;
        left: 50%;
        margin-left: -3px; /* Center manually */
        transform-origin: 50% 45px;
        transform: rotate(0deg);
        border-radius: 3px;
        pointer-events: none; /* Click passthrough */
    `;
    knobVisual.appendChild(indicator);

    let isDragging = false;
    let startY = 0;
    let startValue = 3; // Default Rate

    const updateKnob = (value) => {
        const min = 0;
        const max = 10;
        const normalized = (value - min) / (max - min);
        // Range: -135 to +135 degrees
        const degrees = -135 + (normalized * 270);
        indicator.style.transform = `rotate(${degrees}deg)`;
        plugin.audioNode.setParamValue('rate', value);
    };

    // DRAG LOGIC (Robust)
    const onMove = (y) => {
        if (!isDragging) return;
        const delta = (startY - y) * 0.05;
        const newValue = Math.max(0, Math.min(10, startValue + delta));
        updateKnob(newValue);
    };

    const startDrag = (y) => {
        isDragging = true;
        startY = y;
        startValue = plugin.audioNode.getParamValue('rate') || 3;
    };

    knobVisual.addEventListener('mousedown', (e) => {
        e.stopPropagation(); e.preventDefault();
        startDrag(e.clientY);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    const onMouseMove = (e) => { e.stopPropagation(); e.preventDefault(); onMove(e.clientY); };
    const onMouseUp = () => { isDragging = false; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };

    // Touch
    knobVisual.addEventListener('touchstart', (e) => { e.stopPropagation(); startDrag(e.touches[0].clientY); }, { passive: false });
    knobVisual.addEventListener('touchmove', (e) => { e.stopPropagation(); onMove(e.touches[0].clientY); }, { passive: false });
    knobVisual.addEventListener('touchend', () => isDragging = false);
    knobVisual.addEventListener('pointerdown', (e) => { e.stopPropagation(); startDrag(e.clientY); });

    // Init
    updateKnob(3);

    rateWrapper.appendChild(knobVisual);
    rateWrapper.appendChild(rateLabel);
    controls.appendChild(rateWrapper);

    container.appendChild(controls);

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 15px;
        height: 15px;
        background: #ff3333;
        border-radius: 50%;
        margin-top: 20px;
        box-shadow: 0 0 10px #ff3333;
        border: 1px solid #500;
    `;
    container.appendChild(led);

    return container;
}
