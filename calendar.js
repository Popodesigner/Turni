class CalendarView {
    constructor() {
        this.calendar = null;
        this.calendarEl = document.getElementById('calendar');
        console.log('CalendarView inizializzato, elemento calendario:', this.calendarEl);
    }

    initialize() {
        this.calendar = new FullCalendar.Calendar(this.calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'it-it',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
            },
            firstDay: 1, // Inizia da lunedì
            height: 'auto',
            eventClick: this.handleEventClick.bind(this),
            eventDidMount: this.handleEventRender.bind(this),
            eventDisplay: 'block', // Mostra gli eventi come blocchi
            displayEventTime: false, // Nascondi l'ora predefinita
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            dayMaxEvents: true // Permetti "more" link per giorni con molti eventi
        });

        this.calendar.render();

        // Carica gli eventi iniziali se ci sono
        if (typeof shiftsManager !== 'undefined') {
            this.updateEvents(
                shiftsManager.getFormattedShifts(),
                shiftsManager.getActiveFilters()
            );
        }
    }

    updateEvents(data, filters) {
        // Verifica che il calendario sia stato inizializzato
        if (!this.calendar) return;

        // Rimuoviamo tutti gli eventi esistenti
        this.calendar.removeAllEvents();

        // Filtriamo e convertiamo i dati in eventi
        const events = data
            .filter(row => {
                const type = row.tipo.toLowerCase();
                if (type.includes('mattina') && !filters.morningShift) return false;
                if (type.includes('sera') && !filters.eveningShift) return false;
                if (type.includes('reperibilità') && !filters.onCall) return false;
                if (type.includes('ferie') && !filters.vacations) return false;
                if (type.includes('104') && !filters.law104) return false;
                if (type.includes('permesso') && !filters.permits) return false;
                return true;
            })
            .map(row => this.createEvent(row));

        // Aggiungiamo i nuovi eventi
        this.calendar.addEventSource({ events: events });
        this.calendar.render(); // Forza il re-render del calendario
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

        return {
            title: `${row.tecnico} - ${row.tipo}`,
            start: row.data,
            allDay: true,
            className: `${eventClass} monthly-event`,
            extendedProps: {
                tecnico: row.tecnico,
                tipo: row.tipo,
                orario: row.orario,
                note: row.note
            }
        };
    }

    handleEventClick(info) {
        const event = info.event;
        const props = event.extendedProps;
        
        alert(`
            Tecnico: ${props.tecnico}
            Tipo: ${props.tipo}
            Data: ${event.start.toLocaleDateString('it-IT')}
            Orario: ${props.orario || 'N/D'}
            Note: ${props.note || 'Nessuna nota'}
        `);
    }

    handleEventRender(info) {
        // Aggiungiamo l'orario al titolo se disponibile
        if (info.event.extendedProps.orario) {
            const timeElement = document.createElement('div');
            timeElement.className = 'fc-event-time';
            timeElement.innerHTML = info.event.extendedProps.orario;
            info.el.appendChild(timeElement);
        }
    }
}

// Inizializziamo il calendario
const calendarView = new CalendarView(); 