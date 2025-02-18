class ShiftsManager {
    constructor() {
        this.shifts = this.loadShifts();
        this.setupEventListeners();
        this.searchTimeout = null;
        this.loading = false;
    }

    initialize() {
        this.renderShifts();
        this.updateTechnicianSelect();
    }

    setupEventListeners() {
        const modal = document.getElementById('shiftModal');
        const addButton = document.getElementById('addShift');
        const span = modal.querySelector('.close');
        const form = document.getElementById('shiftForm');
        const typeInputs = form.querySelectorAll('input[name="shiftType"]');

        // Apertura/chiusura modale
        addButton.addEventListener('click', () => {
            this.updateTechnicianSelect();
            this.resetForm();
            modal.style.display = 'block';
        });

        span.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        // Gestione form
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveShift();
            modal.style.display = 'none';
        });

        // Mostra/nascondi campo orario in base al tipo
        typeInputs.forEach(input => {
            input.addEventListener('change', () => {
                const timeGroup = document.getElementById('timeGroup');
                timeGroup.style.display = 
                    ['morning', 'evening'].includes(input.value) ? 'block' : 'none';
            });
        });

        // Filtri
        document.getElementById('showMorningShift').addEventListener('change', () => this.renderShifts());
        document.getElementById('showEveningShift').addEventListener('change', () => this.renderShifts());
        document.getElementById('showVacations').addEventListener('change', () => this.renderShifts());
        document.getElementById('showLaw104').addEventListener('change', () => this.renderShifts());
        document.getElementById('showPermits').addEventListener('change', () => this.renderShifts());
        document.getElementById('showOnCall').addEventListener('change', () => this.renderShifts());

        // Ascoltiamo l'evento di aggiornamento tecnici
        window.addEventListener('techniciansUpdated', () => {
            this.updateTechnicianSelect();
        });

        // Quick search
        document.getElementById('quickSearch')?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.renderShifts();
            }, 300);
        });

        // Period filter
        document.getElementById('periodFilter')?.addEventListener('change', (e) => {
            const customDateRange = document.getElementById('customDateRange');
            if (customDateRange) {
                customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
            this.renderShifts();
        });

        // Custom date range
        ['filterDateStart', 'filterDateEnd'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.renderShifts());
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        document.getElementById('addShift')?.click();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('quickSearch')?.focus();
                        break;
                }
            }
        });

        // Gestione selezione multipla
        document.addEventListener('change', (e) => {
            if (e.target.matches('.shift-select')) {
                this.handleShiftSelection(e.target);
            }
        });

        // Select all shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                const tbody = document.getElementById('shiftsTableBody');
                if (document.activeElement.tagName === 'BODY' || 
                    tbody.contains(document.activeElement)) {
                    e.preventDefault();
                    this.toggleSelectAll();
                }
            }
        });
    }

    loadShifts() {
        const saved = localStorage.getItem('shifts');
        return saved ? JSON.parse(saved) : [];
    }

    saveShift() {
        const id = document.getElementById('shiftId').value;
        const type = document.querySelector('input[name="shiftType"]:checked')?.value;
        
        if (!type) {
            this.showNotification('Seleziona un tipo di turno', 'error');
            return;
        }

        const technicianId = document.getElementById('shiftTechnician').value;
        if (!technicianId) {
            this.showNotification('Seleziona un tecnico', 'error');
            return;
        }

        const dateStart = new Date(document.getElementById('shiftDateStart').value);
        const dateEnd = document.getElementById('shiftDateEnd').value ? 
            new Date(document.getElementById('shiftDateEnd').value) : dateStart;

        if (dateEnd < dateStart) {
            this.showNotification('La data di fine non può essere precedente alla data di inizio', 'error');
            return;
        }

        try {
            // Se è una modifica di un turno esistente
            if (id) {
                if (!confirm('Confermi la modifica del turno?')) {
                    return;
                }
                // Modifica singolo turno
                const shift = {
                    id: id,
                    date: dateStart.toISOString().split('T')[0],
                    technicianId: technicianId,
                    type: type,
                    time: ['morning', 'evening'].includes(type) ? 
                        (type === 'morning' ? '07:00-16:00' : '14:00-22:00') : '',
                    notes: document.getElementById('shiftNotes').value
                };
                
                const index = this.shifts.findIndex(s => s.id === id);
                if (index !== -1) {
                    this.shifts[index] = shift;
                }
            } else {
                // Nuovo turno - verifica sovrapposizioni
                const dates = this.getDatesInRange(dateStart, dateEnd);
                const newShifts = [];
                
                for (const date of dates) {
                    const dateStr = date.toISOString().split('T')[0];
                    
                    // Verifica sovrapposizioni
                    const existingShift = this.shifts.find(s => 
                        s.date === dateStr && 
                        s.technicianId === technicianId
                    );

                    if (existingShift) {
                        if (!confirm(`Esiste già un turno per ${this.getTechnicianName(technicianId)} il ${this.formatDate(dateStr)}. Vuoi sovrascriverlo?`)) {
                            continue;
                        }
                        // Rimuovi il turno esistente
                        this.shifts = this.shifts.filter(s => s.id !== existingShift.id);
                    }

                    // Crea nuovo turno
                    newShifts.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        date: dateStr,
                        technicianId: technicianId,
                        type: type,
                        time: ['morning', 'evening'].includes(type) ? 
                            (type === 'morning' ? '07:00-16:00' : '14:00-22:00') : '',
                        notes: document.getElementById('shiftNotes').value
                    });
                }

                // Aggiungi i nuovi turni
                this.shifts.push(...newShifts);
                
                if (newShifts.length > 0) {
                    this.showNotification(`${newShifts.length} turni salvati con successo`);
                }
            }

            this.persistShifts();
            this.renderShifts();
            document.getElementById('shiftModal').style.display = 'none';
        } catch (error) {
            console.error('Errore nel salvataggio del turno:', error);
            this.showNotification('Errore nel salvataggio del turno', 'error');
        }
    }

    getDatesInRange(start, end) {
        const dates = [];
        const current = new Date(start);
        current.setHours(0, 0, 0, 0);
        const last = new Date(end);
        last.setHours(23, 59, 59, 999);
        
        while (current <= last) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }

    persistShifts() {
        localStorage.setItem('shifts', JSON.stringify(this.shifts));
        
        // Aggiorna le viste
        if (typeof calendarView !== 'undefined' && appState.currentView === 'calendar') {
            calendarView.updateEvents(this.getFormattedShifts(), this.getActiveFilters());
        }
        if (typeof quarterView !== 'undefined' && appState.currentView === 'quarter') {
            quarterView.updateEvents();
        }
        if (typeof statisticsManager !== 'undefined' && appState.currentView === 'stats') {
            statisticsManager.updateStats();
        }
    }

    getFormattedShifts() {
        return this.shifts.map(shift => {
            const technician = techniciansManager.getTechnicians()
                .find(t => t.id === shift.technicianId);
            
            return {
                id: shift.id,
                data: shift.date,
                tecnico: technician ? technician.name : 'N/D',
                tipo: this.getShiftTypeLabel(shift.type),
                orario: shift.time,
                note: shift.notes
            };
        });
    }

    getShiftTypeLabel(type) {
        const labels = {
            morning: 'Turno Mattina',
            evening: 'Turno Sera',
            'on-call': 'Reperibilità',
            vacation: 'Ferie',
            law104: 'Legge 104',
            permit: 'Permesso'
        };
        return labels[type] || type;
    }

    getActiveFilters() {
        return {
            morningShift: document.getElementById('showMorningShift').checked,
            eveningShift: document.getElementById('showEveningShift').checked,
            onCall: document.getElementById('showOnCall').checked,
            vacations: document.getElementById('showVacations').checked,
            law104: document.getElementById('showLaw104').checked,
            permits: document.getElementById('showPermits').checked
        };
    }

    updateTechnicianSelect() {
        const select = document.getElementById('shiftTechnician');
        const technicians = techniciansManager.getTechnicians();
        
        // Salviamo il valore selezionato corrente
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Seleziona un tecnico</option>' +
            technicians.map(tech => 
                `<option value="${tech.id}" ${tech.id === currentValue ? 'selected' : ''}>
                    ${tech.name}
                </option>`
            ).join('');
    }

    showLoading() {
        if (this.loading) return;
        this.loading = true;
        
        const loader = document.createElement('div');
        loader.className = 'loading';
        document.body.appendChild(loader);
    }

    hideLoading() {
        this.loading = false;
        const loader = document.querySelector('.loading');
        if (loader) loader.remove();
    }

    async renderShifts() {
        this.showLoading();
        
        try {
            const tbody = document.getElementById('shiftsTableBody');
            const filters = this.getActiveFilters();
            const searchTerm = (document.getElementById('quickSearch')?.value || '').toLowerCase();
            const periodFilter = document.getElementById('periodFilter')?.value;
            
            let filteredShifts = this.getFormattedShifts()
                .sort((a, b) => {
                    const dateCompare = new Date(a.data) - new Date(b.data);
                    if (dateCompare !== 0) return dateCompare;
                    return a.tecnico.localeCompare(b.tecnico);
                })
                .filter(shift => {
                    // Filtri tipo
                    const type = shift.tipo.toLowerCase();
                    if (type.includes('mattina') && !filters.morningShift) return false;
                    if (type.includes('sera') && !filters.eveningShift) return false;
                    if (type.includes('reperibilità') && !filters.onCall) return false;
                    if (type.includes('ferie') && !filters.vacations) return false;
                    if (type.includes('104') && !filters.law104) return false;
                    if (type.includes('permesso') && !filters.permits) return false;

                    // Ricerca rapida
                    if (searchTerm) {
                        const searchString = `${shift.tecnico} ${shift.tipo} ${shift.data} ${shift.note || ''}`.toLowerCase();
                        if (!searchString.includes(searchTerm)) return false;
                    }

                    // Filtro periodo
                    const shiftDate = new Date(shift.data);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    switch(periodFilter) {
                        case 'today':
                            return shiftDate.getTime() === today.getTime();
                        case 'week':
                            const weekStart = new Date(today);
                            weekStart.setDate(today.getDate() - today.getDay());
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekStart.getDate() + 6);
                            return shiftDate >= weekStart && shiftDate <= weekEnd;
                        case 'month':
                            return shiftDate.getMonth() === today.getMonth() && 
                                   shiftDate.getFullYear() === today.getFullYear();
                        case 'custom':
                            const startDate = document.getElementById('filterDateStart')?.value;
                            const endDate = document.getElementById('filterDateEnd')?.value;
                            if (startDate && shiftDate < new Date(startDate)) return false;
                            if (endDate && shiftDate > new Date(endDate)) return false;
                            return true;
                        default:
                            return true;
                    }
                });

            // Render table rows
            tbody.innerHTML = '';
            filteredShifts.forEach(shift => {
                const tr = document.createElement('tr');
                const typeClass = this.getShiftTypeClass(shift.tipo);
                tr.innerHTML = `
                    <td>
                        <input type="checkbox" class="shift-select" value="${shift.id}">
                        ${this.formatDate(shift.data)}
                    </td>
                    <td>${shift.tecnico}</td>
                    <td><span class="shift-tag ${typeClass}">${shift.tipo}</span></td>
                    <td>${shift.orario || ''}</td>
                    <td>${shift.note || ''}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" onclick="shiftsManager.editShift('${shift.id}')" data-shortcut="⌘E">
                            <i class="fas fa-edit"></i> Modifica
                        </button>
                        <button class="delete-btn" onclick="shiftsManager.deleteShift('${shift.id}')" data-shortcut="⌘⌫">
                            <i class="fas fa-trash"></i> Elimina
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Update total count
            const totalShifts = document.getElementById('totalShifts');
            if (totalShifts) {
                totalShifts.innerHTML = `
                    Totale turni: ${filteredShifts.length}
                    <button id="deleteSelected" class="delete-selected-btn" style="display: none;">
                        <i class="fas fa-trash"></i> Elimina selezionati
                    </button>
                `;
            }
        } finally {
            this.hideLoading();
        }
    }

    getShiftTypeClass(type) {
        const typeMap = {
            'Turno Mattina': 'shift-morning',
            'Turno Sera': 'shift-evening',
            'Reperibilità': 'shift-on-call',
            'Ferie': 'shift-vacation',
            'Legge 104': 'shift-law104',
            'Permesso': 'shift-permit'
        };
        return typeMap[type] || '';
    }

    resetForm() {
        document.getElementById('shiftId').value = '';
        document.getElementById('shiftDateStart').value = '';
        document.getElementById('shiftDateEnd').value = '';
        document.getElementById('shiftTechnician').value = '';
        document.getElementById('shiftNotes').value = '';
        document.querySelectorAll('input[name="shiftType"]').forEach(input => input.checked = false);
        document.getElementById('timeGroup').style.display = 'none';
    }

    editShift(id) {
        const shift = this.shifts.find(s => s.id === id);
        if (!shift) return;

        // Popola il form con i dati del turno
        document.getElementById('shiftId').value = shift.id;
        document.getElementById('shiftDateStart').value = shift.date;
        document.getElementById('shiftDateEnd').value = shift.date;
        document.getElementById('shiftTechnician').value = shift.technicianId;
        document.getElementById('shiftNotes').value = shift.notes;

        // Seleziona il tipo di turno
        const typeRadio = document.querySelector(`input[name="shiftType"][value="${shift.type}"]`);
        if (typeRadio) {
            typeRadio.checked = true;
            // Mostra/nascondi il campo orario se necessario
            document.getElementById('timeGroup').style.display = 
                ['morning', 'evening'].includes(shift.type) ? 'block' : 'none';
        }

        // Imposta l'orario se presente
        if (shift.time) {
            document.getElementById('shiftTime').value = shift.time;
        }

        // Apri il modale
        document.getElementById('shiftModal').style.display = 'block';
    }

    deleteShift(id) {
        const shift = this.shifts.find(s => s.id === id);
        if (!shift) return;

        const technician = this.getTechnicianName(shift.technicianId);
        const date = this.formatDate(shift.date);
        const type = this.getShiftTypeLabel(shift.type);

        if (confirm(`Sei sicuro di voler eliminare questo turno?\n\nTecnico: ${technician}\nData: ${date}\nTipo: ${type}`)) {
            this.shifts = this.shifts.filter(s => s.id !== id);
            this.persistShifts();
            this.renderShifts();
            
            // Mostra notifica
            this.showNotification('Turno eliminato con successo');
        }
    }

    getTechnicianName(id) {
        const technician = techniciansManager.getTechnicians()
            .find(t => t.id === id);
        return technician ? technician.name : 'N/D';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Rimuovi dopo 3 secondi
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    checkOverlap(date, technicianId, excludeId = null) {
        return this.shifts.some(shift => 
            shift.date === date && 
            shift.technicianId === technicianId && 
            shift.id !== excludeId
        );
    }

    formatDateRange(start, end) {
        if (start === end) return this.formatDate(start);
        return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    }

    handleShiftSelection(checkbox) {
        const tr = checkbox.closest('tr');
        tr.classList.toggle('selected', checkbox.checked);
        
        const deleteSelectedBtn = document.getElementById('deleteSelected');
        const selectedCount = document.querySelectorAll('.shift-select:checked').length;
        
        if (deleteSelectedBtn) {
            deleteSelectedBtn.style.display = selectedCount > 0 ? 'inline-flex' : 'none';
            deleteSelectedBtn.onclick = () => this.deleteSelectedShifts();
        }
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.shift-select');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            this.handleShiftSelection(cb);
        });
    }

    deleteSelectedShifts() {
        const selectedIds = Array.from(document.querySelectorAll('.shift-select:checked'))
            .map(cb => cb.value);
        
        if (selectedIds.length === 0) return;

        const selectedShifts = this.shifts.filter(s => selectedIds.includes(s.id));
        const summary = selectedShifts.reduce((acc, shift) => {
            const date = this.formatDate(shift.date);
            const tech = this.getTechnicianName(shift.technicianId);
            acc[tech] = acc[tech] || [];
            acc[tech].push(date);
            return acc;
        }, {});

        let message = 'Sei sicuro di voler eliminare i seguenti turni?\n\n';
        Object.entries(summary).forEach(([tech, dates]) => {
            message += `${tech}:\n${dates.join(', ')}\n\n`;
        });

        if (confirm(message)) {
            this.shifts = this.shifts.filter(s => !selectedIds.includes(s.id));
            this.persistShifts();
            this.renderShifts();
            this.showNotification(`${selectedIds.length} turni eliminati con successo`);
        }
    }
}

// Inizializziamo il gestore dei turni dopo il caricamento del DOM
let shiftsManager;
document.addEventListener('DOMContentLoaded', () => {
    shiftsManager = new ShiftsManager();
    shiftsManager.initialize();
}); 