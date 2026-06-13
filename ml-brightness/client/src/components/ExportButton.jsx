import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportButton({ history, kwhSaved, efficiencyScore, report }) {
  function exportPDF() {
    const doc = new jsPDF();

    doc.setFillColor(8, 11, 20);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(6, 214, 160);
    doc.setFontSize(20);
    doc.text('MoodSense — Energy Report', 14, 20);

    doc.setTextColor(180, 180, 200);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Summary', 14, 40);

    autoTable(doc, {
      startY: 44,
      head: [['Metric', 'Value']],
      body: [
        ['Energy Saved (kWh)',    kwhSaved.toFixed(6)],
        ['CO₂ Saved (kg)',        (kwhSaved * 0.233).toFixed(4)],
        ['Efficiency Score',      `${efficiencyScore}%`],
        ['Best ML Model',         report?.best ?? '--'],
        ['Total Readings',        history.length],
      ],
      styles:     { fillColor: [15, 20, 35], textColor: [200, 210, 230], fontSize: 10 },
      headStyles: { fillColor: [6, 214, 160], textColor: [8, 11, 20] },
    });

    if (history.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text('Recent Readings', 14, doc.lastAutoTable.finalY + 12);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Time', 'Lux', 'ML %', 'Actual %', 'Saving %', 'Temp °C']],
        body: history.slice(0, 30).map(r => [r.time, r.lux, r.ml, r.actual, r.saving, r.temp]),
        styles:     { fillColor: [15, 20, 35], textColor: [200, 210, 230], fontSize: 9 },
        headStyles: { fillColor: [76, 201, 240], textColor: [8, 11, 20] },
      });
    }

    doc.save('moodsense-report.pdf');
  }

  return (
  <button
    onClick={exportPDF}
    className="flex items-center gap-2 transition-all"
    style={{ 
      background: 'rgba(255, 255, 255, 0.03)', 
      color: '#94a3b8', // Muted Slate
      padding: '12px 24px',
      borderRadius: '14px', 
      fontSize: '12px', 
      fontWeight: '800', 
      border: '1px solid rgba(255, 255, 255, 0.08)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
      e.currentTarget.style.color = '#f8fafc';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
      e.currentTarget.style.color = '#94a3b8';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    }}
  >
    <span style={{ fontSize: '14px' }}>📄</span> 
    Export Data
  </button>
);
}
