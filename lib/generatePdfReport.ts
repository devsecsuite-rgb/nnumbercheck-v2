// lib/generatePdfReport.ts

export async function generatePdfReport(aircraft: any, purchase: any) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let y = 0;

  const sky: [number, number, number] = [2, 132, 199];
  const dark: [number, number, number] = [15, 23, 42];
  const gray: [number, number, number] = [100, 116, 139];
  const amber: [number, number, number] = [245, 158, 11];
  const red: [number, number, number] = [239, 68, 68];
  const light: [number, number, number] = [248, 250, 252];

  function addHeader() {
    doc.setFillColor(sky[0], sky[1], sky[2]);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NNumberCheck', margin, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Aircraft History Report', margin, 46);
    y = 90;
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 60) {
      doc.addPage();
      addHeader();
    }
  }

  addHeader();

  // Aircraft header block
  doc.setFillColor(light[0], light[1], light[2]);
  doc.rect(margin, y, contentWidth, 105, 'F');

  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(30);
  doc.text(aircraft.n_number, margin + 20, y + 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  const aircraftTitle = `${aircraft.year ? aircraft.year + ' ' : ''}${aircraft.make || ''} ${aircraft.model || ''}`.trim() || 'Aircraft';
  doc.text(aircraftTitle, margin + 20, y + 58);

  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin + 20, y + 72, 130, 20, 3, 3, 'F');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${aircraft.registration_status || 'Unknown'} Registration`, margin + 30, y + 86);

  y += 130;

    // Data freshness
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 30, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text('Data freshness — refreshed weekly from official sources', margin + 10, y + 12);
  doc.setFontSize(7);
  doc.text(
    `Report generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
    margin + 10,
    y + 22
  );
  y += 45;
  
  // Registration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Registration Details', margin, y);
  y += 8;
  doc.setDrawColor(sky[0], sky[1], sky[2]);
  doc.setLineWidth(2);
  doc.line(margin, y, margin + 60, y);
  y += 25;

  const regFields: [string, any][] = [
    ['N-Number', aircraft.n_number],
    ['Serial Number', aircraft.serial_number],
    ['Manufacturer', aircraft.make],
    ['Model', aircraft.model],
    ['Year', aircraft.year?.toString()],
    ['Registration Status', aircraft.registration_status],
    ['Airworthiness Date', aircraft.airworthiness_date],
    ['Owner', aircraft.owner_name],
    ['Owner Location', [aircraft.owner_city, aircraft.owner_state].filter(Boolean).join(', ')],
  ];

  doc.setFontSize(10);
  regFields.forEach(([label, value]) => {
    if (!value) return;
    ensureSpace(20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(String(value), margin + 180, y);
    y += 18;
  });

  y += 25;

  // Accidents
  ensureSpace(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Complete Accident History', margin, y);
  y += 8;
  doc.setDrawColor(red[0], red[1], red[2]);
  doc.setLineWidth(2);
  doc.line(margin, y, margin + 60, y);
  y += 25;

  if (!aircraft.accidents || aircraft.accidents.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('No NTSB accidents found for this aircraft.', margin, y);
    y += 30;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(
      `${aircraft.accidents.length} record${aircraft.accidents.length === 1 ? '' : 's'} on file from 1982 to present`,
      margin,
      y
    );
    y += 20;

    aircraft.accidents.forEach((acc: any) => {
      ensureSpace(80);
      doc.setFillColor(red[0], red[1], red[2]);
      doc.rect(margin, y - 10, 3, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(acc.event_date || 'Unknown date', margin + 15, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`Severity: ${acc.severity || 'Unknown'}`, margin + 130, y);

      y += 16;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(acc.location || 'Location unknown', margin + 15, y);

      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      const summaryLines = doc.splitTextToSize(acc.summary || '', contentWidth - 30);
      doc.text(summaryLines, margin + 15, y);
      y += summaryLines.length * 12 + 20;
    });
  }

  y += 15;

  // ADs
  ensureSpace(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Applicable Airworthiness Directives', margin, y);
  y += 8;
  doc.setDrawColor(amber[0], amber[1], amber[2]);
  doc.setLineWidth(2);
  doc.line(margin, y, margin + 60, y);
  y += 25;

  if (!aircraft.directives || aircraft.directives.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('No matching ADs found for this aircraft.', margin, y);
    y += 30;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(
      `${aircraft.directives.length} potentially applicable directive${aircraft.directives.length === 1 ? '' : 's'} found`,
      margin,
      y
    );
    y += 20;

    aircraft.directives.forEach((ad: any) => {
      ensureSpace(120);
      doc.setFillColor(amber[0], amber[1], amber[2]);
      doc.rect(margin, y - 10, 3, 4, 'F');

      doc.setFillColor(254, 243, 199);
      const adLabel = `AD ${ad.ad_number}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const labelWidth = doc.getTextWidth(adLabel) + 14;
      doc.roundedRect(margin + 15, y - 12, labelWidth, 18, 2, 2, 'F');
      doc.setTextColor(146, 64, 14);
      doc.text(adLabel, margin + 22, y);

      if (ad.effective_date) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(`Effective: ${ad.effective_date}`, margin + 15 + labelWidth + 12, y);
      }

      y += 22;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      const titleLines = doc.splitTextToSize(ad.title || '', contentWidth - 30);
      doc.text(titleLines, margin + 15, y);
      y += titleLines.length * 13 + 6;

      if (ad.abstract) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        const absLines = doc.splitTextToSize(ad.abstract, contentWidth - 30);
        doc.text(absLines, margin + 15, y);
        y += absLines.length * 12 + 6;
      }

      if (ad.document_url) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(sky[0], sky[1], sky[2]);
        doc.textWithLink('View official document on FederalRegister.gov', margin + 15, y, {
          url: ad.document_url,
        });
        y += 14;
      }

      y += 18;
    });
  }

  y += 20;

  // Receipt
  ensureSpace(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Purchase Receipt', margin, y);
  y += 8;
  doc.setDrawColor(sky[0], sky[1], sky[2]);
  doc.setLineWidth(2);
  doc.line(margin, y, margin + 60, y);
  y += 25;

  const receiptFields: [string, any][] = [
    ['Transaction ID', purchase?.paddle_transaction_id],
    ['Purchased On', purchase?.created_at],
    [
      'Amount Paid',
      purchase?.amount_cents
        ? `$${(purchase.amount_cents / 100).toFixed(2)} ${purchase.currency || ''}`
        : null,
    ],
    ['Status', purchase?.status],
  ];

  doc.setFontSize(10);
  receiptFields.forEach(([label, value]) => {
    if (!value) return;
    ensureSpace(20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(String(label), margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(String(value), margin + 180, y);
    y += 18;
  });

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(
      'Not affiliated with the FAA or NTSB. For historical reference only.',
      margin,
      pageHeight - 30
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 30, {
      align: 'right',
    });
  }

  // Download
  const filename = `NNumberCheck_${aircraft.n_number}_History_Report.pdf`;
  doc.save(filename);
}
