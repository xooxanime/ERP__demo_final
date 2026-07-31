import PDFDocument from 'pdfkit';

/**
 * Generates a clean, professional, print-optimized PDF invoice/receipt from payment and ledger data.
 * @param {Object} payment - The Payment document.
 * @param {Object} ledger - The StudentFeeLedger document.
 * @param {Object} student - The Student user object.
 * @param {Object} parent - The Parent user object (optional).
 * @param {Object} session - The AcademicSession document.
 * @param {Object} settings - System settings (for custom prefix, logo details).
 * @param {stream.Writable} writeStream - Writable stream to pipe the generated PDF to.
 */
export const generateReceiptPDF = (payment, ledger, student, parent, session, settings, writeStream) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  doc.pipe(writeStream);

  const schoolName = settings?.schoolName || 'SHRI Educational World';
  const receiptPrefix = settings?.receiptPrefix || 'REC';
  const receiptNo = payment.utrNumber ? `${receiptPrefix}-${payment.utrNumber}` : `${receiptPrefix}-${payment._id.toString().substring(18).toUpperCase()}`;

  // Header Logo Placeholder / Title
  doc.fillColor('#1F2937')
     .font('Helvetica-Bold')
     .fontSize(20)
     .text(schoolName, 50, 50);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text('CA Foundation & Intermediate Academy', 50, 75)
     .text('Email: billing@shriedu.com | support@shriedu.com', 50, 90);

  // Receipt Details (Top Right)
  doc.fillColor('#1F2937')
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('FEES RECEIPT', 400, 50, { align: 'right' });

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#374151')
     .text(`Receipt No: ${receiptNo}`, 400, 70, { align: 'right' })
     .text(`Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}`, 400, 85, { align: 'right' })
     .text(`Session: ${session?.name || '2026-27'}`, 400, 100, { align: 'right' });

  // Divider Line
  doc.moveTo(50, 125).lineTo(550, 125).strokeColor('#E5E7EB').stroke();

  // Student & Parent details columns
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#1F2937')
     .text('BILL TO:', 50, 145);

  doc.font('Helvetica')
     .fontSize(9)
     .text(`Student Name : ${student.name}`, 50, 160)
     .text(`Email ID     : ${student.email}`, 50, 175)
     .text(`Phone No     : ${student.phone}`, 50, 190);

  if (parent) {
    doc.text(`Parent Name  : ${parent.name}`, 300, 160)
       .text(`Relationship : ${parent.parentInfo?.relationship || 'Guardian'}`, 300, 175)
       .text(`Parent Phone : ${parent.phone || 'N/A'}`, 300, 190);
  } else if (student.parentInfo?.studentName) {
    doc.text(`Parent/Guardian: ${student.parentInfo.studentName}`, 300, 160);
  }

  // Divider
  doc.moveTo(50, 215).lineTo(550, 215).strokeColor('#E5E7EB').stroke();

  // Table Headers
  let yPosition = 235;
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#374151')
     .text('Fee Head Description', 50, yPosition)
     .text('Base Amount', 250, yPosition, { width: 80, align: 'right' })
     .text('Discount', 330, yPosition, { width: 70, align: 'right' })
     .text('Late Fine', 410, yPosition, { width: 60, align: 'right' })
     .text('Total Paid', 480, yPosition, { width: 70, align: 'right' });

  doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).strokeColor('#F3F4F6').lineWidth(1.5).stroke();

  // Table Items
  yPosition += 25;
  doc.font('Helvetica').fontSize(9).fillColor('#4B5563');

  if (ledger && ledger.items && ledger.items.length > 0) {
    ledger.items.forEach(item => {
      // Find fee head name if populated, else use headName fallback
      const headName = item.feeHeadId?.name || item.headName || 'Tuition Fee';
      doc.text(headName, 50, yPosition)
         .text(`INR ${item.baseAmount.toFixed(2)}`, 250, yPosition, { width: 80, align: 'right' })
         .text(`INR ${item.discount.toFixed(2)}`, 330, yPosition, { width: 70, align: 'right' })
         .text(`INR ${item.fine.toFixed(2)}`, 410, yPosition, { width: 60, align: 'right' })
         .text(`INR ${item.finalAmount.toFixed(2)}`, 480, yPosition, { width: 70, align: 'right' });
      yPosition += 20;
    });
  } else {
    // Fallback if ledger items are empty or missing
    doc.text(ledger?.title || 'Generic Fee payment', 50, yPosition)
       .text(`INR ${payment.amount.toFixed(2)}`, 480, yPosition, { width: 70, align: 'right' });
    yPosition += 20;
  }

  // Divider
  doc.moveTo(50, yPosition + 5).lineTo(550, yPosition + 5).strokeColor('#E5E7EB').stroke();

  // Summary section
  yPosition += 20;
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#1F2937')
     .text('SUMMARY:', 50, yPosition);

  doc.font('Helvetica')
     .fontSize(9)
     .text(`Payment Method : ${payment.paymentMethod === 'razorpay' ? 'Razorpay Online' : 'Manual UTR Verification'}`, 50, yPosition + 15)
     .text(`Transaction ID : ${payment.razorpayPaymentId || payment.utrNumber || 'N/A'}`, 50, yPosition + 30)
     .text(`Status         : SUCCESS`, 50, yPosition + 45);

  const finalAmount = ledger ? ledger.totalFinalAmount : payment.amount;
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Grand Total:', 350, yPosition)
     .text(`INR ${finalAmount.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });

  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#10B981')
     .text('Amount Paid:', 350, yPosition + 20)
     .text(`INR ${payment.amount.toFixed(2)}`, 450, yPosition + 20, { width: 100, align: 'right' });

  // Verification Stamps
  doc.moveTo(50, 480).lineTo(550, 480).strokeColor('#E5E7EB').lineWidth(1).stroke();

  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#9CA3AF')
     .text('This is an electronically generated receipt. No signature is required. System Audit Trail Verified.', 50, 500, { align: 'center' });

  doc.end();
};
