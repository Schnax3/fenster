const state = {
    color1: '#8B6B4E',
    color2: '#F9FAFB',
    pattern: 'solid'
};

const canvas = document.getElementById('curtainCanvas');
const ctx = canvas.getContext('2d');
const windowFrame = document.getElementById('windowFrame');

function getVal(id) { return parseFloat(document.getElementById(id).value) || 0; }

// Erstellt die Stoff-Textur
function buildPattern() {
    const p = document.createElement('canvas');
    const s = 80; p.width = s; p.height = s;
    const pc = p.getContext('2d');
    
    pc.fillStyle = state.color1;
    pc.fillRect(0,0,s,s);
    pc.fillStyle = state.color2;
    
    if(state.pattern === 'stripes-v') {
        pc.globalAlpha = 0.4;
        pc.fillRect(0,0,s/4,s);
    }
    if(state.pattern === 'check') {
        pc.globalAlpha = 0.3;
        pc.fillRect(0,0,s/2,s/2);
        pc.fillRect(s/2,s/2,s/2,s/2);
    }
    if(state.pattern === 'linen') {
        pc.globalAlpha = 0.2;
        pc.strokeStyle = state.color2;
        pc.lineWidth = 2;
        for(let i=0; i<s; i+=8) {
            pc.moveTo(i,0); pc.lineTo(i,s);
            pc.moveTo(0,i); pc.lineTo(s,i);
        }
        pc.stroke();
    }
    return ctx.createPattern(p, 'repeat');
}

// Zeichnet einen einzelnen Vorhangflügel mit Schattenwurf
function drawCurtain(x, width, height) {
    if (width <= 0) return;
    const foldStrength = getVal('foldRange') / 100;
    
    ctx.save();
    // Basis-Stoff zeichnen
    ctx.fillStyle = state.pattern === 'solid' ? state.color1 : buildPattern();
    ctx.fillRect(x, 0, width, height);

    // Schatten für Faltenwurf (3D Effekt)
    const foldWidth = 35; // Breite einer Falte
    const numFolds = Math.ceil(width / foldWidth);
    
    for (let i = 0; i < numFolds; i++) {
        const fx = x + i * (width / numFolds);
        const fw = width / numFolds;
        
        const gradient = ctx.createLinearGradient(fx, 0, fx + fw, 0);
        gradient.addColorStop(0, `rgba(0,0,0,${0.35 * foldStrength})`);
        gradient.addColorStop(0.5, `rgba(255,255,255,${0.18 * foldStrength})`);
        gradient.addColorStop(1, `rgba(0,0,0,${0.35 * foldStrength})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(fx, 0, fw, height);
    }
    ctx.restore();
}

function render() {
    const winW = getVal('winW'), winH = getVal('winH');
    const ratio = winW / winH;
    
    // Dynamische Skalierung der Vorschau basierend auf dem verfügbaren Platz
    const viewport = document.querySelector('.canvas-viewport');
    let displayW = viewport.clientWidth * 0.75;
    let displayH = displayW / ratio;

    // Schutz vor zu hoher Darstellung
    if (displayH > viewport.clientHeight * 0.65) {
        displayH = viewport.clientHeight * 0.65;
        displayW = displayH * ratio;
    }

    // Fenster-Element im DOM anpassen
    windowFrame.style.width = displayW + 'px';
    windowFrame.style.height = displayH + 'px';
    
    // Canvas Auflösung (mit Überhang für die Seiten)
    canvas.width = windowFrame.clientWidth + 200; // 100px Puffer pro Seite
    canvas.height = windowFrame.clientHeight + 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const curH_px = (getVal('curH') / winH) * displayH;
    const curWL_px = (getVal('curWLeft') / winW) * displayW;
    const curWR_px = (getVal('curWRight') / winW) * displayW;
    
    const mode = document.getElementById('curtainMode').value;

    // Vorhänge zeichnen (0 ist ganz links im Canvas-Puffer)
    if (mode === '2' || mode === '1L') {
        drawCurtain(0, curWL_px, curH_px);
    }
    
    if (mode === '2' || mode === '1R') {
        drawCurtain(canvas.width - curWR_px, curWR_px, curH_px);
    }

    // UI Badges aktualisieren
    document.getElementById('labelW').textContent = winW;
    document.getElementById('labelH').textContent = winH;
}

// Event-Handling
window.addEventListener('resize', render);

document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
        if(el.id === 'foldRange') {
            document.getElementById('foldVal').textContent = el.value + '%';
        }
        render();
    });
});

document.getElementById('colorPicker').addEventListener('input', e => {
    state.color1 = e.target.value;
    document.getElementById('colorHex').value = e.target.value.toUpperCase();
    render();
});

document.getElementById('colorHex').addEventListener('input', e => {
    if(/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        state.color1 = e.target.value;
        document.getElementById('colorPicker').value = e.target.value;
        render();
    }
});

document.getElementById('patternGrid').addEventListener('click', e => {
    const btn = e.target.closest('.pattern-btn');
    if(!btn) return;
    document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.pattern = btn.dataset.pattern;
    render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'interior-design-plan.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Initialer Start
render();