import { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AgreementDocument({ agreement, guest, room, property, onClose }) {
  const { user } = useAuth();
  const printRef = useRef(null);

  const handleDownloadPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PG Agreement - ${guest?.name || 'Guest'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #1a1a2e;
            line-height: 1.7;
            padding: 40px 50px;
            background: white;
          }

          .agreement-header {
            text-align: center;
            border-bottom: 3px double #7c3aed;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }

          .agreement-header h1 {
            font-size: 22px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .agreement-header .subtitle {
            font-size: 13px;
            color: #64748b;
          }

          .agreement-ref {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 24px;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
          }

          .section {
            margin-bottom: 20px;
          }

          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #7c3aed;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
          }

          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 24px;
            font-size: 13px;
          }

          .detail-row {
            display: flex;
            gap: 8px;
          }

          .detail-label {
            font-weight: 600;
            color: #475569;
            min-width: 130px;
          }

          .detail-value {
            color: #1a1a2e;
          }

          .terms-list {
            font-size: 13px;
            padding-left: 20px;
            color: #334155;
          }

          .terms-list li {
            margin-bottom: 8px;
            line-height: 1.6;
          }

          .consent-text {
            font-size: 13px;
            color: #334155;
            line-height: 1.8;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 3px solid #7c3aed;
            margin-bottom: 20px;
          }

          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 48px;
            page-break-inside: avoid;
          }

          .signature-block {
            text-align: center;
          }

          .signature-line {
            border-top: 1px solid #1a1a2e;
            margin-top: 60px;
            padding-top: 8px;
            font-size: 13px;
            font-weight: 600;
          }

          .signature-name {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }

          .footer-note {
            text-align: center;
            margin-top: 40px;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
          }

          @media print {
            body { padding: 20px 30px; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const agreementTypeLabel = {
    'Monthly': '1 Month',
    'Quarterly': '3 Months',
    'Semi-Annual': '6 Months (Half-Yearly)',
    'Annual': '12 Months (Yearly)',
    'Custom': 'Custom Duration',
  };

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content xl" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        <div className="modal-header">
          <h3>📋 Rental Agreement</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF}>
              📄 Download PDF
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ overflow: 'auto', maxHeight: 'calc(92vh - 140px)' }}>
          {/* Printable Agreement Content */}
          <div ref={printRef} className="agreement-print-content">
            <div className="agreement-header">
              <h1>Paying Guest Accommodation Agreement</h1>
              <div className="subtitle">{property?.name || 'PG Accommodation'} • {property?.address || ''}</div>
            </div>

            <div className="agreement-ref">
              <span>Agreement ID: {agreement?.id?.toUpperCase() || 'N/A'}</span>
              <span>Date: {today}</span>
            </div>

            {/* Landlord Details */}
            <div className="section">
              <div className="section-title">Landlord / PG Owner Details</div>
              <div className="details-grid">
                <div className="detail-row">
                  <span className="detail-label">Owner Name:</span>
                  <span className="detail-value">{user?.name || 'Landlord'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Property:</span>
                  <span className="detail-value">{property?.name || 'PG Accommodation'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{property?.address || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Contact:</span>
                  <span className="detail-value">{user?.phone ? `+91 ${user.phone}` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Tenant Details */}
            <div className="section">
              <div className="section-title">Tenant / Guest Details</div>
              <div className="details-grid">
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{guest?.name || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{guest?.phone ? `+91 ${guest.phone}` : '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{guest?.email || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">ID Proof:</span>
                  <span className="detail-value">{guest?.idType}: {guest?.idNumber || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Occupation:</span>
                  <span className="detail-value">{guest?.occupation || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Company:</span>
                  <span className="detail-value">{guest?.company || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Emergency Contact:</span>
                  <span className="detail-value">{guest?.emergencyName || '—'} ({guest?.emergencyContact ? `+91 ${guest.emergencyContact}` : '—'})</span>
                </div>
              </div>
            </div>

            {/* Room & Financial Details */}
            <div className="section">
              <div className="section-title">Accommodation & Financial Details</div>
              <div className="details-grid">
                <div className="detail-row">
                  <span className="detail-label">Room Number:</span>
                  <span className="detail-value">Room {room?.number || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Room Type:</span>
                  <span className="detail-value">{room?.type || '—'} Occupancy</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Monthly Rent:</span>
                  <span className="detail-value">{formatCurrency(agreement?.rent || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Security Deposit:</span>
                  <span className="detail-value">{formatCurrency(agreement?.deposit || 0)} {agreement?.depositPaid ? '(Paid ✓)' : '(Pending)'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Agreement Type:</span>
                  <span className="detail-value">{agreementTypeLabel[agreement?.type] || agreement?.type || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(agreement?.startDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">End Date:</span>
                  <span className="detail-value">{formatDate(agreement?.endDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Rent Due Date:</span>
                  <span className="detail-value">5th of every month</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="section">
              <div className="section-title">Terms & Conditions</div>
              <ol className="terms-list">
                <li>The Tenant agrees to pay a monthly rent of <strong>{formatCurrency(agreement?.rent || 0)}</strong> to the Landlord on or before the 5th day of each calendar month. A late fee of ₹500 will be charged for payments made after the due date.</li>
                <li>A refundable security deposit of <strong>{formatCurrency(agreement?.deposit || 0)}</strong> has been collected from the Tenant. This deposit will be refunded within 15 days of vacating the premises, after deducting any outstanding dues or damage charges.</li>
                <li>This agreement is valid from <strong>{formatDate(agreement?.startDate)}</strong> to <strong>{formatDate(agreement?.endDate)}</strong>. The Tenant must provide a minimum of 30 days written notice before vacating the premises. Early termination without notice will result in forfeiture of the security deposit.</li>
                <li>The Tenant shall use the allocated Room No. <strong>{room?.number || '—'}</strong> strictly for residential purposes only. Running any commercial activity, subletting, or unauthorized occupants are strictly prohibited.</li>
                <li>The Tenant shall maintain the room and common areas in a clean and hygienic condition. Any damage to the property, furniture, fixtures, or appliances caused by the Tenant will be repaired/replaced at the Tenant's expense.</li>
                <li>The Tenant agrees to follow the PG house rules including: no smoking or consumption of alcohol on the premises, maintaining silence after 10 PM, visitor hours restricted to 9 AM – 9 PM, and no pets allowed.</li>
                <li>The Landlord reserves the right to terminate this agreement with immediate effect in case of violation of any terms, illegal activities, non-payment of rent for more than 15 days, or any behavior that disrupts the peace of other residents.</li>
                <li>Electricity and water charges are included in the rent unless stated otherwise. Excessive usage beyond reasonable limits may be billed separately at the Landlord's discretion.</li>
                <li>The Tenant's personal belongings are their own responsibility. The Landlord shall not be held liable for any loss, theft, or damage to the Tenant's personal property.</li>
                <li>Any disputes arising from this agreement shall be resolved amicably between both parties. If unresolved, the dispute shall be subject to the jurisdiction of the local courts.</li>
              </ol>
            </div>

            {/* Consent Declaration */}
            <div className="consent-text">
              <strong>Declaration:</strong> I, <strong>{guest?.name || '_______________'}</strong>, hereby declare that I have read and understood all the terms and conditions mentioned above. I agree to abide by the rules and regulations of the PG accommodation. I confirm that all the information provided by me is true and accurate to the best of my knowledge. I voluntarily enter into this agreement and accept all the terms stated herein.
            </div>

            {/* Signatures */}
            <div className="signature-section">
              <div className="signature-block">
                <div className="signature-line">Landlord / PG Owner</div>
                <div className="signature-name">{user?.name || 'Landlord'}</div>
              </div>
              <div className="signature-block">
                <div className="signature-line">Tenant / Guest</div>
                <div className="signature-name">{guest?.name || '_______________'}</div>
              </div>
            </div>

            <div className="footer-note">
              This is a computer-generated agreement. Both parties are advised to retain a signed copy for their records.<br />
              Generated on {today} by PG Manager System.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
