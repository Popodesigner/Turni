class StatisticsManager {
    constructor() {
        this.technicianChart = null;
        this.shiftTypeChart = null;
        this.initialized = false;
        this.setupEventListeners();
    }

    initialize() {
        if (!window.Chart) {
            console.error('Chart.js non è stato caricato');
            return;
        }
        this.initialized = true;
        this.updateStats();
    }

    setupEventListeners() {
        // Aggiorna le statistiche quando i turni vengono modificati
        window.addEventListener('shiftsUpdated', () => {
            if (this.initialized) this.updateStats();
        });

        // Aggiorna le statistiche quando i tecnici vengono modificati
        window.addEventListener('techniciansUpdated', () => {
            if (this.initialized) this.updateStats();
        });

        // Aggiorna quando si cambia vista
        document.getElementById('viewStats')?.addEventListener('click', () => {
            setTimeout(() => {
                if (this.initialized) this.updateStats();
            }, 100);
        });
    }

    updateStats() {
        console.log('Aggiornamento statistiche...');
        if (!shiftsManager || !techniciansManager) {
            console.warn('Managers non ancora inizializzati');
            return;
        }

        const shifts = shiftsManager.getFormattedShifts();
        const technicians = techniciansManager.getTechnicians();
        
        console.log('Turni:', shifts.length);
        console.log('Tecnici:', technicians.length);

        try {
            this.updateTechnicianChart(shifts, technicians);
            this.updateShiftTypeChart(shifts);
            this.updateMonthlyStats(shifts, technicians);
        } catch (error) {
            console.error('Errore nell\'aggiornamento delle statistiche:', error);
        }
    }

    updateTechnicianChart(shifts, technicians) {
        const ctx = document.getElementById('technicianChart');
        if (!ctx) {
            console.warn('Canvas per il grafico tecnici non trovato');
            return;
        }

        // Raggruppa i tecnici per ruolo
        const techsByRole = technicians.reduce((acc, tech) => {
            if (!acc[tech.role]) acc[tech.role] = [];
            acc[tech.role].push(tech);
            return acc;
        }, {});

        // Prepara i dati per ogni ruolo
        const datasets = [];
        const colors = {
            'tecnico': '#536dfe',
            'ufficio_tecnico': '#00c853',
            'amministrazione': '#7c4dff',
            'contabilita': '#ffd740'
        };

        Object.entries(techsByRole).forEach(([role, techs]) => {
            const data = techs.map(tech => {
                const techShifts = shifts.filter(s => s.tecnico === tech.name).length;
                return techShifts;
            });

            datasets.push({
                label: this.formatRole(role),
                data: data,
                backgroundColor: colors[role],
                borderColor: colors[role],
                borderWidth: 1
            });
        });

        const labels = technicians.map(t => t.name.split(' ')[0]); // Solo il nome

        if (this.technicianChart) {
            this.technicianChart.destroy();
        }

        this.technicianChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribuzione Turni per Dipendente'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Numero di Turni'
                        }
                    }
                }
            }
        });

        // Aggiorna la legenda personalizzata
        this.updateChartLegend(datasets);
    }

    updateChartLegend(datasets) {
        const legendContainer = document.querySelector('.chart-legend');
        if (!legendContainer) return;

        legendContainer.innerHTML = datasets.map(dataset => `
            <div class="legend-item">
                <span class="legend-color" style="background: ${dataset.backgroundColor}"></span>
                <span>${dataset.label}</span>
            </div>
        `).join('');
    }

    updateShiftTypeChart(shifts) {
        const ctx = document.getElementById('shiftTypeChart');
        if (!ctx) {
            console.warn('Canvas per il grafico tipi turno non trovato');
            return;
        }

        const shiftTypes = {
            'mattina': { count: 0, color: '#536dfe', label: 'Mattina' },
            'sera': { count: 0, color: '#1a237e', label: 'Sera' },
            'reperibilità': { count: 0, color: '#00c853', label: 'Reperibilità' },
            'ferie': { count: 0, color: '#ff5252', label: 'Ferie' },
            '104': { count: 0, color: '#ffd740', label: 'Legge 104' },
            'permesso': { count: 0, color: '#7c4dff', label: 'Permessi' }
        };

        shifts.forEach(shift => {
            const type = shift.tipo.toLowerCase();
            Object.keys(shiftTypes).forEach(key => {
                if (type.includes(key)) {
                    shiftTypes[key].count++;
                }
            });
        });

        if (this.shiftTypeChart) {
            this.shiftTypeChart.destroy();
        }

        this.shiftTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.values(shiftTypes).map(t => t.label),
                datasets: [{
                    data: Object.values(shiftTypes).map(t => t.count),
                    backgroundColor: Object.values(shiftTypes).map(t => t.color)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Distribuzione Tipi di Turno'
                    }
                }
            }
        });
    }

    updateMonthlyStats(shifts, technicians) {
        const monthlyStatsDiv = document.getElementById('monthlyStats');
        if (!monthlyStatsDiv) {
            console.warn('Container statistiche mensili non trovato');
            return;
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Filtra i turni del mese corrente
        const monthShifts = shifts.filter(shift => {
            const shiftDate = new Date(shift.data);
            return shiftDate.getMonth() === currentMonth && 
                   shiftDate.getFullYear() === currentYear;
        });

        // Raggruppa per ruolo
        const statsByRole = technicians.reduce((acc, tech) => {
            if (!acc[tech.role]) {
                acc[tech.role] = {
                    total: 0,
                    technicians: {}
                };
            }
            acc[tech.role].technicians[tech.name] = 0;
            return acc;
        }, {});

        // Conta i turni
        monthShifts.forEach(shift => {
            const tech = technicians.find(t => t.name === shift.tecnico);
            if (tech && statsByRole[tech.role]) {
                statsByRole[tech.role].total++;
                statsByRole[tech.role].technicians[shift.tecnico]++;
            }
        });

        // Genera l'HTML
        let html = `<h4>Riepilogo ${new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h4>`;
        
        Object.entries(statsByRole).forEach(([role, stats]) => {
            html += `
                <div class="monthly-stat">
                    <h5>
                        ${this.formatRole(role)}
                        <span>${stats.total} turni</span>
                    </h5>
                    <ul>
                        ${Object.entries(stats.technicians)
                            .filter(([_, count]) => count > 0)
                            .map(([name, count]) => `
                                <li>
                                    <span>${name}</span>
                                    <span>${count} turni</span>
                                </li>
                            `).join('')}
                    </ul>
                </div>
            `;
        });

        monthlyStatsDiv.innerHTML = html;
    }

    formatRole(role) {
        const roles = {
            'tecnico': 'Tecnico',
            'ufficio_tecnico': 'Ufficio Tecnico',
            'amministrazione': 'Amministrazione',
            'contabilita': 'Contabilità'
        };
        return roles[role] || role;
    }
}

// Inizializzazione
let statisticsManager;

// Assicuriamoci che Chart.js sia caricato prima di inizializzare
function initializeStatistics() {
    if (!statisticsManager) {
        statisticsManager = new StatisticsManager();
    }
    
    // Verifica che tutti i componenti necessari siano caricati
    if (window.Chart && shiftsManager && techniciansManager) {
        console.log('Inizializzazione statistiche...');
        statisticsManager.initialize();
    } else {
        console.warn('In attesa del caricamento dei componenti necessari...');
        setTimeout(initializeStatistics, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Aggiungi un ritardo per assicurarti che tutti i manager siano inizializzati
    setTimeout(initializeStatistics, 500);
}); 