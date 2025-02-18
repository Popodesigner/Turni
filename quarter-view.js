class QuarterView {
    constructor() {
        this.calendars = [];
        this.currentDate = new Date();
        this.setupEventListeners();
    }

    initialize() {
        // Inizializza i tre calendari
        for (let i = 0; i < 3; i++) {
            const calendarEl = document.getElementById(`month${i + 1}`);
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: '',
                    center: 'title',
                    right: ''
                },
                locale: 'it-it',
                height: 'auto',
                eventClick: this.handleEventClick.bind(this),
                eventDidMount: this.handleEventRender.bind(this)
            });
            this.calendars.push(calendar);
        }

        this.updateQuarterView();
    }

    setupEventListeners() {
        document.getElementById('prevQuarter').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 3);
            this.updateQuarterView();
        });

        document.getElementById('nextQuarter').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 3);
            this.updateQuarterView();
        });

        // Aggiorna la vista quando cambiano i filtri
        const filterIds = ['showMorningShift', 'showEveningShift', 'showVacations', 
                          'showLaw104', 'showPermits'];
        filterIds.forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateEvents();
            });
        });
    }

    updateQuarterView() {
        // Aggiorna il titolo
        const startMonth = new Date(this.currentDate);
        startMonth.setDate(1);
        const endMonth = new Date(this.currentDate);
        endMonth.setMonth(endMonth.getMonth() + 2);
        
        document.getElementById('quarterTitle').textContent = 
            `${this.formatMonthYear(startMonth)} - ${this.formatMonthYear(endMonth)}`;

        // Aggiorna i calendari
        this.calendars.forEach((calendar, index) => {
            const date = new Date(this.currentDate);
            date.setMonth(date.getMonth() + index);
            calendar.gotoDate(date);
            calendar.render();
        });

        this.updateEvents();
    }

    updateEvents() {
        if (!shiftsManager) return;

        const events = shiftsManager.getFormattedShifts();
        const filters = shiftsManager.getActiveFilters();

        // Filtra gli eventi
        const filteredEvents = events.filter(event => {
            const type = event.tipo.toLowerCase();
            if (type.includes('mattina') && !document.getElementById('showMorningShift').checked) return false;
            if (type.includes('sera') && !document.getElementById('showEveningShift').checked) return false;
            if (type.includes('ferie') && !document.getElementById('showVacations').checked) return false;
            if (type.includes('104') && !document.getElementById('showLaw104').checked) return false;
            if (type.includes('permesso') && !document.getElementById('showPermits').checked) return false;
            return true;
        });

        // Converti gli eventi nel formato FullCalendar
        const calendarEvents = filteredEvents.map(event => this.createEvent(event));

        // Aggiorna tutti i calendari
        this.calendars.forEach(calendar => {
            calendar.removeAllEvents();
            calendar.addEventSource(calendarEvents);
        });
    }

    createEvent(row) {
        const type = row.tipo.toLowerCase();
        let eventClass = '';
        
        // Aggiorniamo le classi degli eventi
        if (type.includes('mattina')) {
            eventClass = 'shift-morning';
        } else if (type.includes('sera')) {
            eventClass = 'shift-evening';
        } else if (type.includes('ferie')) {
            eventClass = 'shift-vacation';
        } else if (type.includes('104')) {
            eventClass = 'shift-law104';
        } else if (type.includes('reperibilità')) {
            eventClass = 'shift-on-call';
        } else if (type.includes('permesso')) {
            eventClass = 'shift-permit';
        }

        // Ottieni le iniziali del tecnico
        const initials = row.tecnico
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();

        return {
            title: initials, // Solo le iniziali
            start: row.data,
            allDay: true,
            className: `${eventClass} quarter-event`, // Aggiungi classe specifica per vista trimestrale
            extendedProps: {
                tecnico: row.tecnico,
                tipo: row.tipo,
                orario: row.orario,
                note: row.note
            }
        };
    }

    getEventClass(type) {
        const typeMap = {
            'Turno Mattina': 'shift-morning',
            'Turno Sera': 'shift-evening',
            'Ferie': 'shift-vacation',
            'Legge 104': 'shift-law104',
            'Permesso': 'shift-permit'
        };
        return typeMap[type] || '';
    }

    handleEventClick(info) {
        const event = info.event;
        const props = event.extendedProps;
        
        alert(`
            Tecnico: ${props.tecnico}
            Tipo: ${props.tipo}
            Data: ${event.start.toLocaleDateString('it-IT')}
            Orario: ${props.orario}
            Note: ${props.note || 'Nessuna nota'}
        `);
    }

    handleEventRender(info) {
        if (info.event.extendedProps.orario) {
            const timeElement = document.createElement('div');
            timeElement.className = 'fc-event-time';
            timeElement.innerHTML = info.event.extendedProps.orario;
            info.el.appendChild(timeElement);
        }
    }

    formatMonthYear(date) {
        return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    }
}

// Inizializziamo la vista trimestrale
const quarterView = new QuarterView(); 