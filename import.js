class ExcelImporter {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const importButton = document.getElementById('importExcel');
        importButton.addEventListener('click', () => this.createFileInput());
    }

    createFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xls,.xlsx';
        input.onchange = (e) => this.handleFileSelect(e);
        input.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => this.parseExcelFile(e.target.result);
        reader.readAsArrayBuffer(file);
    }

    parseExcelFile(data) {
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Rimuoviamo l'intestazione
            const headers = jsonData.shift();
            
            // Convertiamo i dati nel nostro formato
            const formattedData = this.formatData(jsonData);
            
            // Aggiorniamo la tabella
            this.updateTable(formattedData);
        } catch (error) {
            alert('Errore durante l\'importazione del file Excel: ' + error.message);
        }
    }

    formatData(data) {
        return data.map(row => {
            return {
                data: this.formatDate(row[0]),
                tecnico: row[1],
                tipo: row[2],
                orario: row[3],
                note: row[4] || ''
            };
        });
    }

    formatDate(dateValue) {
        // Gestiamo sia date in formato Excel che stringhe
        if (typeof dateValue === 'number') {
            // Convertiamo il numero seriale Excel in data
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        return dateValue;
    }

    updateTable(data) {
        const tbody = document.getElementById('shiftsTableBody');
        tbody.innerHTML = ''; // Puliamo la tabella

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.data}</td>
                <td>${row.tecnico}</td>
                <td>${row.tipo}</td>
                <td>${row.orario}</td>
                <td>${row.note}</td>
            `;
            tbody.appendChild(tr);
        });

        // Aggiorniamo lo stato dell'applicazione
        window.dispatchEvent(new CustomEvent('dataImported', { detail: data }));
    }
}

// Inizializziamo l'importatore
const excelImporter = new ExcelImporter(); 