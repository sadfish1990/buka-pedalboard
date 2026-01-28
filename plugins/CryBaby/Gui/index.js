// CryBaby GUI - Classic Treadle
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        background: url('https://www.transparenttextures.com/patterns/black-scales.png'), #111;
        color: #ddd;
        font-family: 'Arial Black', sans-serif;
        border-radius: 12px;
        width: 140px;
        height: 320px;
        border: 4px solid #444;
        box-shadow: 0 10px 20px rgba(0,0,0,0.8);
        user-select: none;
        touch-action: none;
    `;

    // Title
    const title = document.createElement('div');
    title.textContent = "CRY BABY";
    title.style.cssText = "font-size: 18px; color: #fff; margin-bottom: 20px; letter-spacing: 1px; text-shadow: 0 2px 4px #000;";
    container.appendChild(title);

    // Treadle Container
    const pedalBg = document.createElement('div');
    pedalBg.style.cssText = `
        width: 100px;
        height: 220px;
        background: #222;
        border-radius: 6px;
        position: relative;
        border: 2px solid #000;
        box-shadow: inset 0 0 15px #000;
        margin-bottom: 15px;
    `;

    // Treadle Plate
    const treadle = document.createElement('div');
    treadle.style.cssText = `
        width: 90px;
        height: 180px;
        background: url('https://www.transparenttextures.com/patterns/diamond-upholstery.png'), #333;
        border: 1px solid #666;
        border-radius: 4px;
        position: absolute;
        left: 3px;
        bottom: 5px; 
        cursor: grab;
        box-shadow: 0 5px 15px rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        touch-action: none;
    `;

    // Logo on treadle
    const treadleLogo = document.createElement('div');
    treadleLogo.textContent = "Wah";
    treadleLogo.style.cssText = "margin-top: 130px; font-size: 24px; color: #aaa; opacity: 0.5; font-weight: bold;";
    treadle.appendChild(treadleLogo);

    // Logic
    const minBottom = 5;
    const maxBottom = 35; // Less travel visual range for perspective trick
    // Wait, typical wah treadle tilts. Vertical slider is abstraction.
    // Let's make it a slider but visual looks like top-down view? 
    // Or better, side view?
    // Let's stick to the PitchPedal style vertical slider but with Rubber texture.
    // Adjust maxBottom for full range within the box (220px height)

    const sliderMax = 220 - 180 - 5; // 35px
    // That's too little movement. 
    // Let's make the treadle smaller relative to BG or BG larger.
    // Or simpler: Just a slider.

    // Let's resize visually:
    treadle.style.height = "100px";
    // New Range:
    // Container 220. Treadle 100.
    const sliderMin = 5;
    const sliderLimit = 220 - 100 - 5; // 115px top
    const travel = sliderLimit - sliderMin; // 110px

    let isDragging = false;
    let startY = 0;
    let startBottom = sliderMin;

    const updatePedal = (val) => {
        const bottom = sliderMin + (val * travel);
        treadle.style.bottom = `${bottom}px`;
        plugin.audioNode.setParamValue('pedal', val);

        // Tilt
        const tilt = 15 - (val * 30);
        treadle.style.transform = `perspective(400px) rotateX(${tilt}deg)`;
    };

    // ROBUST EVENTS (Pointer Capture)
    const stop = (e) => e.stopPropagation();

    treadle.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault();
        treadle.setPointerCapture(e.pointerId);
        isDragging = true;
        startY = e.clientY;
        const currentBot = parseFloat(treadle.style.bottom) || sliderMin;
        startBottom = currentBot;
        treadle.style.cursor = 'grabbing';
    });

    treadle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        e.stopPropagation(); e.preventDefault();
        const delta = startY - e.clientY;
        let newBottom = startBottom + delta;
        newBottom = Math.max(sliderMin, Math.min(newBottom, sliderLimit));
        const norm = (newBottom - sliderMin) / travel;
        updatePedal(norm);
    });

    treadle.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        isDragging = false;
        treadle.style.cursor = 'grab';
        treadle.releasePointerCapture(e.pointerId);
    });

    treadle.addEventListener('click', stop);
    treadle.addEventListener('mousedown', stop);
    treadle.addEventListener('touchstart', stop);

    // Bypass Button (Footswitch style)
    const switchBtn = document.createElement('div');
    switchBtn.style.cssText = `
        width: 30px; height: 30px; background: #c0c0c0; border-radius: 50%;
        margin-top: 10px; border: 3px solid #888; cursor: pointer;
        box-shadow: 0 4px 5px rgba(0,0,0,0.5);
    `;

    let isBypassed = false;
    switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isBypassed = !isBypassed;
        plugin.audioNode.setParamValue('bypass', isBypassed ? 1 : 0);

        // Visual feedback
        title.style.color = isBypassed ? "#555" : "#fff";
        switchBtn.style.transform = "scale(0.95)";
        setTimeout(() => switchBtn.style.transform = "scale(1)", 100);
    });
    switchBtn.addEventListener('mousedown', stop);
    switchBtn.addEventListener('touchstart', stop);

    // Init
    updatePedal(0);

    pedalBg.appendChild(treadle);
    container.appendChild(pedalBg);
    container.appendChild(switchBtn);

    return container;
}
