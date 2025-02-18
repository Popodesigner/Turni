class ScreenshotManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('captureCalendar')?.addEventListener('click', () => {
            this.captureCalendar();
        });

        document.getElementById('captureQuarter')?.addEventListener('click', () => {
            this.captureQuarter();
        });
    }

    async captureCalendar() {
        const element = document.querySelector('.calendar-view');
        if (!element) return;

        try {
            // Nascondi temporaneamente il pulsante
            const btn = element.querySelector('.capture-btn');
            if (btn) btn.style.display = 'none';

            // Cattura
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            // Ripristina il pulsante
            if (btn) btn.style.display = '';

            // Scarica
            const date = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
            const filename = `calendario_mensile_${date}.png`;
            
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Errore screenshot:', error);
            alert('Errore durante la cattura dello screenshot');
        }
    }

    async captureQuarter() {
        const element = document.querySelector('.quarter-view');
        if (!element) return;

        try {
            // Nascondi temporaneamente il pulsante
            const btn = element.querySelector('.capture-btn');
            if (btn) btn.style.display = 'none';

            // Cattura
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            // Ripristina il pulsante
            if (btn) btn.style.display = '';

            // Scarica
            const date = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
            const filename = `calendario_trimestrale_${date}.png`;
            
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Errore screenshot:', error);
            alert('Errore durante la cattura dello screenshot');
        }
    }
}

// Inizializza
const screenshotManager = new ScreenshotManager(); 