import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatTime = (isoString) => {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const exportSessionsToPDF = (sessions, isAggregated, selectedUser, selectedSemester, totalTime) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Writing Sessions Report', 14, 22);

  // Metadata
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  let yPos = 38;

  if (selectedUser) {
    doc.text(`User: ${selectedUser}`, 14, yPos);
    yPos += 6;
  }

  if (selectedSemester) {
    doc.text(`Semester: ${selectedSemester}`, 14, yPos);
    yPos += 6;
  }

  doc.text(`Total Time: ${formatDuration(totalTime)}`, 14, yPos);
  yPos += 10;

  // Table
  if (isAggregated) {
    // Aggregated view
    const tableData = sessions.map(userStat => [
      userStat.user_name,
      userStat.session_count.toString(),
      formatDuration(userStat.total_time)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['User', 'Total Sessions', 'Total Time Logged']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });
  } else {
    // Detailed view
    const tableData = sessions.map(session => [
      formatDate(session.started_at),
      formatTime(session.started_at),
      formatTime(session.ended_at),
      formatDuration(session.duration),
      session.description || '—'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Start', 'End', 'Duration', 'Description']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: {
        4: { cellWidth: 60 }
      }
    });
  }

  // Save
  const filename = `writing-sessions-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const exportSessionsToExcel = (sessions, isAggregated, selectedUser, selectedSemester, totalTime) => {
  let worksheetData;

  if (isAggregated) {
    // Aggregated view
    worksheetData = [
      ['Writing Sessions Report - Aggregated by User'],
      [`Generated: ${new Date().toLocaleString()}`],
      selectedSemester ? [`Semester: ${selectedSemester}`] : [],
      [`Total Time: ${formatDuration(totalTime)}`],
      [],
      ['User', 'Total Sessions', 'Total Time Logged'],
      ...sessions.map(userStat => [
        userStat.user_name,
        userStat.session_count,
        formatDuration(userStat.total_time)
      ])
    ];
  } else {
    // Detailed view
    worksheetData = [
      ['Writing Sessions Report - Detailed'],
      [`Generated: ${new Date().toLocaleString()}`],
      selectedUser ? [`User: ${selectedUser}`] : [],
      selectedSemester ? [`Semester: ${selectedSemester}`] : [],
      [`Total Time: ${formatDuration(totalTime)}`],
      [],
      ['Date', 'Start', 'End', 'Duration', 'Description'],
      ...sessions.map(session => [
        formatDate(session.started_at),
        formatTime(session.started_at),
        formatTime(session.ended_at),
        formatDuration(session.duration),
        session.description || '—'
      ])
    ];
  }

  // Filter out empty arrays
  worksheetData = worksheetData.filter(row => row.length > 0);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');

  // Auto-size columns
  const maxWidth = worksheetData.reduce((w, r) => Math.max(w, r.length), 10);
  worksheet['!cols'] = Array(maxWidth).fill({ wch: 15 });

  const filename = `writing-sessions-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
