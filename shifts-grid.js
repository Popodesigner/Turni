class ShiftsGridView {
    constructor() {
        this.currentDate = new Date();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateView();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateView();
        });

        // Aggiungi listener per i filtri
        const filterIds = [
            'showMorningShift',
            'showEveningShift',
            'showVacations',
            'showLaw104',
            'showPermits',
            'showOnCall'
        ];

        filterIds.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this.updateView();
            });
        });
    }

    updateView() {
        this.updateHeader();
        this.updateGrid();
    }

    updateHeader() {
        const monthTitle = document.getElementById('currentMonth');
        if (monthTitle) {
            monthTitle.textContent = this.currentDate.toLocaleDateString('it-IT', {
                month: 'long',
                year: 'numeric'
            });
        }
    }

    updateGrid() {
        const table = document.getElementById('shiftsGridTable');
        if (!table || !shiftsManager) return;

        // Genera intestazioni colonne
        const thead = table.querySelector('thead tr');
        thead.innerHTML = `
            <th>Cognome</th>
            <th>Nome</th>
            ${this.generateDayHeaders()}
        `;

        // Genera righe per ogni tecnico
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        const technicians = techniciansManager.getTechnicians();
        const shifts = shiftsManager.getFormattedShifts();
        
        // Otteniamo i filtri direttamente dagli elementi checkbox
        const activeFilters = {
            morningshift: document.getElementById('showMorningShift')?.checked ?? true,
            eveningshift: document.getElementById('showEveningShift')?.checked ?? true,
            oncall: document.getElementById('showOnCall')?.checked ?? true,
            vacations: document.getElementById('showVacations')?.checked ?? true,
            law104: document.getElementById('showLaw104')?.checked ?? true,
            permits: document.getElementById('showPermits')?.checked ?? true
        };

        console.log('Filtri attivi:', activeFilters);

        const daysInMonth = this.getDaysInMonth();

        technicians.forEach(tech => {
            const tr = document.createElement('tr');
            const [lastName, firstName] = tech.name.split(' ');
            
            tr.innerHTML = `
                <td>${lastName || ''}</td>
                <td>${firstName || ''}</td>
                ${this.generateDayCells(shifts, tech.id, daysInMonth, activeFilters)}
            `;
            
            tbody.appendChild(tr);
        });
    }

    generateDayHeaders() {
        const daysInMonth = this.getDaysInMonth();
        let headers = '';
        const weekDays = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayNum = day.toString().padStart(2, '0');
            const weekDay = weekDays[date.getDay()];
            
            headers += `
                <th class="${isWeekend ? 'weekend' : ''}">
                    <div class="day-number">${dayNum}</div>
                    <div class="day-name">${weekDay}</div>
                </th>
            `;
        }
        
        return headers;
    }

    generateDayCells(shifts, techId, daysInMonth, activeFilters) {
        let cells = '';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateStr = date.toISOString().split('T')[0];
            
            const shift = shifts.find(s => 
                s.data === dateStr && 
                s.tecnico === techniciansManager.getTechnicians().find(t => t.id === techId)?.name
            );

            let cellContent = '';
            let cellClass = '';
            let tooltip = '';
            let backgroundColor = '';

            if (shift) {
                const type = shift.tipo.toLowerCase();
                let isVisible = false;

                console.log('Tipo turno:', type);
                console.log('Filtri attivi:', activeFilters);

                if (type.includes('mattina') && activeFilters.morningshift) {
                    cellClass = 'morning-bg';
                    backgroundColor = '#3498db';
                    tooltip = 'Turno Mattina';
                    isVisible = true;
                } else if (type.includes('sera') && activeFilters.eveningshift) {
                    cellClass = 'evening-bg';
                    backgroundColor = '#2c3e50';
                    tooltip = 'Turno Sera';
                    isVisible = true;
                } else if (type.includes('reperibilità') && activeFilters.oncall) {
                    cellClass = 'on-call-bg';
                    backgroundColor = '#27ae60';
                    tooltip = 'Reperibilità';
                    isVisible = true;
                } else if (type.includes('ferie') && activeFilters.vacations) {
                    cellClass = 'vacation-bg';
                    backgroundColor = '#e74c3c';
                    tooltip = 'Ferie';
                    isVisible = true;
                } else if (type.includes('104') && activeFilters.law104) {
                    cellClass = 'law104-bg';
                    backgroundColor = '#f1c40f';
                    tooltip = 'Legge 104';
                    isVisible = true;
                } else if (type.includes('permesso') && activeFilters.permits) {
                    cellClass = 'permit-bg';
                    backgroundColor = '#9b59b6';
                    tooltip = 'Permesso';
                    isVisible = true;
                }

                if (isVisible) {
                    cells += `
                        <td class="${isWeekend ? 'weekend' : ''} ${cellClass ? 'shift-cell ' + cellClass : ''}"
                            ${tooltip ? `data-tooltip="${tooltip}"` : ''}
                            style="${backgroundColor ? `background-color: ${backgroundColor}; color: white;` : ''}">
                            ${cellContent}
                        </td>
                    `;
                } else {
                    cells += `
                        <td class="${isWeekend ? 'weekend' : ''}">
                            ${cellContent}
                        </td>
                    `;
                }
            } else {
                cells += `
                    <td class="${isWeekend ? 'weekend' : ''}">
                        ${cellContent}
                    </td>
                `;
            }
        }
        
        return cells;
    }

    getDaysInMonth() {
        return new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            0
        ).getDate();
    }
}

// Inizializza la vista
const shiftsGridView = new ShiftsGridView(); 