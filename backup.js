class BackupManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('saveBackup').addEventListener('click', () => this.saveBackup());
        document.getElementById('loadBackup').addEventListener('click', () => this.loadBackup());
    }

    saveBackup() {
        const backup = {
            version: '1.0',
            date: new Date().toISOString(),
            data: {
                technicians: localStorage.getItem('technicians'),
                shifts: localStorage.getItem('shifts')
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `turni_backup_${this.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.classList.add('hidden-file-input');

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Verifica versione backup
                    if (!backup.version || !backup.data) {
                        throw new Error('Formato backup non valido');
                    }

                    // Ripristina i dati
                    if (backup.data.technicians) {
                        localStorage.setItem('technicians', backup.data.technicians);
                    }
                    if (backup.data.shifts) {
                        localStorage.setItem('shifts', backup.data.shifts);
                    }

                    // Aggiorna l'interfaccia
                    this.refreshUI();
                    
                    alert('Backup ripristinato con successo!');
                } catch (error) {
                    alert('Errore durante il ripristino del backup: ' + error.message);
                }
            };
            reader.readAsText(file);
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    refreshUI() {
        // Aggiorna la lista dei tecnici
        if (techniciansManager) {
            techniciansManager.technicians = techniciansManager.loadTechnicians();
            techniciansManager.renderTechnicians();
            window.dispatchEvent(new CustomEvent('techniciansUpdated', {
                detail: techniciansManager.technicians
            }));
        }

        // Aggiorna i turni
        if (shiftsManager) {
            shiftsManager.shifts = shiftsManager.loadShifts();
            shiftsManager.renderShifts();
        }

        // Aggiorna il calendario
        if (calendarView && calendarView.calendar) {
            calendarView.updateEvents(
                shiftsManager.getFormattedShifts(),
                shiftsManager.getActiveFilters()
            );
        }
    }

    formatDate(date) {
        return date.toISOString()
            .split('T')[0]
            .replace(/-/g, '');
    }
}

// Inizializziamo il gestore dei backup
const backupManager = new BackupManager(); 