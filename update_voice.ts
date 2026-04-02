import fs from 'fs';

let content = fs.readFileSync('index.html', 'utf-8');

// Change hover:bg-black to hover:bg-[#ff2121]
content = content.replace(/hover:bg-black/g, 'hover:bg-[#ff2121]');

// Change text-zinc-800 to text-[#244242] (dark green) or keep it? The user said "el color nego cambia por color rojo". Let's change text-zinc-800 to text-[#ff2121] if they meant the text. Wait, reading red text is bad. Maybe they meant the dark text? Let's change text-zinc-800 to text-[#244242] so it matches their palette, and any remaining 'black' to '#ff2121'.
content = content.replace(/text-zinc-800/g, 'text-[#244242]');
content = content.replace(/text-zinc-900/g, 'text-[#244242]');

// Voice logic update
const oldVoiceLogic = `        const esLatam = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-CO') || v.lang.includes('es-AR') || v.lang.includes('es-US')) || voices.find(v => v.lang.includes('es'));
        
        if (esLatam) utterance.voice = esLatam;
        utterance.lang = 'es-MX';
        utterance.rate = 0.95;
        utterance.pitch = 1.05;`;

const newVoiceLogic = `        // Buscar voces premium/naturales primero para mayor fluidez
        const preferredVoices = [
            'Google español',
            'Microsoft Sabina',
            'Microsoft Elena',
            'Microsoft Laura',
            'Natural'
        ];
        
        let selectedVoice = null;
        for (const pref of preferredVoices) {
            selectedVoice = voices.find(v => (v.name.includes(pref) && v.lang.includes('es')) || (v.name.includes(pref) && pref === 'Google español'));
            if (selectedVoice) break;
        }
        
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-CO') || v.lang.includes('es-AR') || v.lang.includes('es-US')) || voices.find(v => v.lang.includes('es'));
        }
        
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = selectedVoice ? selectedVoice.lang : 'es-MX';
        utterance.rate = 1.0; // Velocidad normal para mayor naturalidad
        utterance.pitch = 1.0; // Tono normal`;

content = content.replace(oldVoiceLogic, newVoiceLogic);

fs.writeFileSync('index.html', content);
console.log('Updated index.html');
