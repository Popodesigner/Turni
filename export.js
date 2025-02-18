class PDFExporter {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const exportButton = document.getElementById('exportPDF');
        exportButton.addEventListener('click', () => this.exportToPDF());
    }

    exportToPDF() {
        // Creiamo un nuovo documento PDF
        const doc = new jspdf.jsPDF();
        
        // Aggiungiamo il titolo
        doc.setFontSize(18);
        doc.text('Gestione Turni Tecnici', 14, 20);
        
        // Aggiungiamo la data di generazione
        doc.setFontSize(11);
        const today = new Date().toLocaleDateString('it-IT');
        doc.text(`Generato il: ${today}`, 14, 30);

        // Prendiamo i dati dalla tabella
        const tableData = this.getTableData();

        // Configurazione della tabella
        const tableConfig = {
            startY: 40,
            head: [['Data', 'Tecnico', 'Tipo', 'Orario', 'Note']],
            body: tableData,
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [44, 62, 80], // --primary-color
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 246, 250] // --background-color
            },
            margin: { top: 40 }
        };

        // Generiamo la tabella
        doc.autoTable(tableConfig);

        // Aggiungiamo il piè di pagina
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(
                `Pagina ${i} di ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        // Salviamo il PDF
        const fileName = `turni_tecnici_${today.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
    }

    getTableData() {
        const tbody = document.getElementById('shiftsTableBody');
        const rows = tbody.getElementsByTagName('tr');
        const data = [];

        for (let row of rows) {
            const cells = row.getElementsByTagName('td');
            const rowData = [];
            
            for (let cell of cells) {
                rowData.push(cell.textContent.trim());
            }
            
            // Aggiungiamo la riga solo se è visibile
            if (row.style.display !== 'none') {
                data.push(rowData);
            }
        }

        // Ordiniamo i dati per data
        return data.sort((a, b) => {
            const dateA = new Date(a[0]);
            const dateB = new Date(b[0]);
            return dateA - dateB;
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT');
    }
}

// Inizializziamo l'esportatore
const pdfExporter = new PDFExporter(); 