class TechniciansManager {
    constructor() {
        this.technicians = this.loadTechnicians();
        this.setupEventListeners();
        this.editMode = false;
    }

    initialize() {
        this.updateTable();
    }

    setupEventListeners() {
        document.getElementById('technicianForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('technicianId').value;
            const technician = {
                id: id || Date.now().toString(),
                name: document.getElementById('technicianName').value,
                role: document.getElementById('technicianRole').value,
                email: document.getElementById('technicianEmail').value,
                phone: document.getElementById('technicianPhone').value
            };

            if (this.editMode) {
                this.updateTechnician(technician);
            } else {
                this.addTechnician(technician);
            }

            this.saveTechnicians();
            this.updateTable();
            this.resetForm();
        });

        document.getElementById('cancelEdit')?.addEventListener('click', () => {
            this.resetForm();
        });
    }

    resetForm() {
        document.getElementById('technicianForm').reset();
        document.getElementById('technicianId').value = '';
        document.getElementById('cancelEdit').style.display = 'none';
        this.editMode = false;
    }

    loadTechnicians() {
        const saved = localStorage.getItem('technicians');
        return saved ? JSON.parse(saved) : [];
    }

    saveTechnicians() {
        localStorage.setItem('technicians', JSON.stringify(this.technicians));
        // Notifica altri componenti del cambiamento
        window.dispatchEvent(new CustomEvent('techniciansUpdated', {
            detail: this.technicians
        }));
    }

    addTechnician(technician) {
        this.technicians.push(technician);
    }

    updateTechnician(technician) {
        const index = this.technicians.findIndex(t => t.id === technician.id);
        if (index !== -1) {
            this.technicians[index] = technician;
        }
    }

    updateTable() {
        const tbody = document.querySelector('#techniciansTable tbody');
        tbody.innerHTML = '';

        this.technicians.forEach(tech => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tech.name}</td>
                <td class="role">
                    <span class="role-badge role-${tech.role}">${this.formatRole(tech.role)}</span>
                </td>
                <td>${tech.email || '-'}</td>
                <td>${tech.phone || '-'}</td>
                <td>
                    <button class="edit-btn" data-id="${tech.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${tech.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Aggiungi event listeners per i pulsanti
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editTechnician(btn.dataset.id);
            });
        });

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteTechnician(btn.dataset.id);
            });
        });
    }

    editTechnician(id) {
        const technician = this.technicians.find(t => t.id === id);
        if (technician) {
            document.getElementById('technicianId').value = technician.id;
            document.getElementById('technicianName').value = technician.name;
            document.getElementById('technicianRole').value = technician.role;
            document.getElementById('technicianEmail').value = technician.email || '';
            document.getElementById('technicianPhone').value = technician.phone || '';
            document.getElementById('cancelEdit').style.display = 'inline-block';
            this.editMode = true;
            // Scorri alla parte superiore del form
            document.querySelector('.technicians-form-container').scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteTechnician(id) {
        if (confirm('Sei sicuro di voler eliminare questo dipendente?')) {
            this.technicians = this.technicians.filter(t => t.id !== id);
            this.saveTechnicians();
            this.updateTable();
        }
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

    getTechnicians() {
        return this.technicians;
    }
}

// Inizializzazione
let techniciansManager;
document.addEventListener('DOMContentLoaded', () => {
    techniciansManager = new TechniciansManager();
    techniciansManager.initialize();
}); 