// Stato dell'applicazione
const appState = {
    currentView: 'table', // 'table', 'calendar', 'quarter', 'stats'
    filters: {
        morningShift: true,
        eveningShift: true,
        onCall: true,
        vacations: true,
        law104: true,
        permits: true
    },
    data: [] // Array per i dati
};

// Attendiamo che il DOM sia completamente caricato
document.addEventListener('DOMContentLoaded', () => {
    // Funzione per aggiungere event listener in modo sicuro
    function addSafeEventListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Elemento con ID '${id}' non trovato`);
        }
    }

    // Gestione dei click sulla sidebar
    const viewHandlers = {
        'viewTable': () => { appState.currentView = 'table'; },
        'viewCalendar': () => { appState.currentView = 'calendar'; },
        'viewQuarter': () => { appState.currentView = 'quarter'; },
        'viewShifts': () => { appState.currentView = 'shifts'; },
        'viewStats': () => { appState.currentView = 'stats'; },
        'manageTechnicians': () => { appState.currentView = 'technicians'; }
    };

    // Aggiungi event listeners per le viste
    Object.entries(viewHandlers).forEach(([id, handler]) => {
        addSafeEventListener(id, 'click', (e) => {
            e.preventDefault();
            handler();
            updateView();
        });
    });

    // Aggiungi event listeners per i filtri
    const filterIds = [
        'showMorningShift',
        'showEveningShift',
        'showVacations',
        'showLaw104',
        'showPermits',
        'showOnCall'
    ];

    filterIds.forEach(id => {
        addSafeEventListener(id, 'change', (e) => {
            appState.filters[id.replace('show', '').toLowerCase()] = e.target.checked;
            updateView();
        });
    });

    // Aggiungiamo il listener per i dati importati
    window.addEventListener('dataImported', (event) => {
        appState.data = event.detail;
        updateView();
    });

    // Funzione per aggiornare la vista
    function updateView() {
        const tableSection = document.querySelector('.shifts-table');
        const calendarSection = document.querySelector('.calendar-view');
        const quarterSection = document.querySelector('.quarter-view');
        const statsSection = document.querySelector('.statistics');
        const shiftsGridSection = document.querySelector('.shifts-grid-view');
        const techniciansSection = document.querySelector('.technicians-view');
        
        // Nascondi tutte le viste
        tableSection.style.display = 'none';
        calendarSection.style.display = 'none';
        quarterSection.style.display = 'none';
        statsSection.style.display = 'none';
        shiftsGridSection.style.display = 'none';
        techniciansSection.style.display = 'none';

        // Mostra la vista selezionata
        switch (appState.currentView) {
            case 'table':
                tableSection.style.display = 'block';
                updateTableView();
                break;
            case 'calendar':
                calendarSection.style.display = 'block';
                if (!calendarView.calendar) {
                    calendarView.initialize();
                }
                if (shiftsManager) {
                    calendarView.updateEvents(
                        shiftsManager.getFormattedShifts(),
                        shiftsManager.getActiveFilters()
                    );
                }
                break;
            case 'quarter':
                quarterSection.style.display = 'block';
                if (!quarterView.calendars.length) {
                    quarterView.initialize();
                }
                quarterView.updateEvents();
                break;
            case 'stats':
                statsSection.style.display = 'block';
                if (statisticsManager) {
                    statisticsManager.updateStats();
                }
                break;
            case 'shifts':
                shiftsGridSection.style.display = 'block';
                shiftsGridView.updateView();
                break;
            case 'technicians':
                techniciansSection.style.display = 'block';
                break;
        }

        // Aggiorna lo stato attivo nella sidebar
        document.querySelectorAll('.sidebar a').forEach(a => {
            a.classList.remove('active');
            if (a.id === `view${appState.currentView.charAt(0).toUpperCase() + appState.currentView.slice(1)}`) {
                a.classList.add('active');
            }
        });
    }

    function updateTableView() {
        const tbody = document.getElementById('shiftsTableBody');
        if (!shiftsManager) return;

        const shifts = shiftsManager.getFormattedShifts();
        const filters = shiftsManager.getActiveFilters();
        
        const filteredShifts = shifts.filter(shift => {
            const type = shift.tipo.toLowerCase();
            if (type.includes('mattina') && !filters.morningShift) return false;
            if (type.includes('sera') && !filters.eveningShift) return false;
            if (type.includes('reperibilità') && !filters.onCall) return false;
            if (type.includes('ferie') && !filters.vacations) return false;
            if (type.includes('104') && !filters.law104) return false;
            if (type.includes('permesso') && !filters.permits) return false;
            return true;
        });

        tbody.innerHTML = '';
        filteredShifts.forEach(shift => {
            const tr = document.createElement('tr');
            const typeClass = shiftsManager.getShiftTypeClass(shift.tipo);
            tr.innerHTML = `
                <td>${shift.data}</td>
                <td>${shift.tecnico}</td>
                <td><span class="shift-tag ${typeClass}">${shift.tipo}</span></td>
                <td>${shift.orario || ''}</td>
                <td>${shift.note || ''}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="shiftsManager.editShift('${shift.id}')">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
                    <button class="delete-btn" onclick="shiftsManager.deleteShift('${shift.id}')">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Inizializziamo la vista
    updateView();
}); 