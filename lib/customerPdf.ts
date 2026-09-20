import { getBranch } from '@/lib/branches';

// Shared print-to-PDF customer statement, used by both the admin and staff
// dashboards so the two stay identical.

export interface PdfCustomer {
  name: string;
  mobile: string;
  email: string;
  address?: string;
  dob?: string;
  kycStatus: string;
  branch: string;
  joinedDate?: string;
}

export interface PdfLoan {
  loanId: string;
  loanType: string;
  status: string;
  principal: number;
  outstanding: number;
  interestDue: number;
  interestRate: number;
  tenureMonths: number;
  startDate?: string;
  maturityDate?: string;
  nextDueDate?: string;
  goldWeight: number;
  grossWeight?: number;
  goldPurity: number;
  estimatedGoldValue?: number;
}

interface Options {
  /** Charged up-front; shown on both the customer and loan sections. */
  processingFee?: number;
  /** Total interest estimated over the tenure. Falls back to a simple calculation. */
  interestAmount?: number;
}

export const generateCustomerStatementPdf = (
  customer: PdfCustomer,
  loan: PdfLoan | null,
  { processingFee = 0, interestAmount }: Options = {},
) => {
  const branchInfo = getBranch(customer.branch);
  const totalInterest = (interestAmount && interestAmount > 0)
    ? interestAmount
    : (loan ? Math.round(loan.principal * (loan.interestRate / 100) * (loan.tenureMonths / 12)) : 0);

  const row = (label: string, value: string, highlight = false) =>
    `<tr${highlight ? ' class="highlight"' : ''}>
        <td>${label}</td>
        <td>${value}</td>
      </tr>`;

  const loanSection = loan ? `
      <h3 style="font-size:13px;font-weight:700;color:#282828;margin:20px 0 4px;">Loan Details</h3>
      <hr style="border:none;border-top:2px solid #b40000;margin-bottom:8px;"/>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        ${row('Loan ID', loan.loanId)}
        ${row('Loan Type', loan.loanType)}
        ${row('Status', loan.status.charAt(0).toUpperCase() + loan.status.slice(1))}
        ${row('Principal Amount', `Rs. ${loan.principal.toLocaleString('en-IN')}`)}
        ${row('Processing Fee', processingFee > 0 ? `Rs. ${processingFee.toLocaleString('en-IN')}` : 'Nil')}
        ${row('Outstanding Balance', `Rs. ${loan.outstanding.toLocaleString('en-IN')}`)}
        ${row('Interest Amount (Estimated)', `Rs. ${totalInterest.toLocaleString('en-IN')}`)}
        ${row('Interest Due (Accrued)', `Rs. ${loan.interestDue.toLocaleString('en-IN')}`)}
        ${row('Total Due', `Rs. ${(loan.outstanding + loan.interestDue).toLocaleString('en-IN')}`, true)}
        ${row('Interest Rate', `${loan.interestRate}% p.a.`)}
        ${row('Tenure', `${loan.tenureMonths} months`)}
        ${row('Start Date', loan.startDate || 'N/A')}
        ${row('Maturity Date', loan.maturityDate || 'N/A')}
        ${row('Next Due Date', loan.nextDueDate || 'N/A')}
        ${(loan.loanType === 'Gold Loan' || loan.goldWeight > 0) ? `
          ${(loan.grossWeight ?? 0) > 0 ? row('Gross Weight', `${loan.grossWeight} g`) : ''}
          ${row('Gold Weight (Net)', `${loan.goldWeight} g`)}
          ${row('Gold Purity', `${loan.goldPurity}K`)}
          ${row('Est. Gold Value', `Rs. ${loan.estimatedGoldValue?.toLocaleString('en-IN') || 'N/A'}`)}
        ` : ''}
      </table>
    ` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Customer Statement – ${customer.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Noto Sans', 'Noto Sans Telugu', Arial, sans-serif; color: #282828; background: #fff; padding: 0; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 10mm; size: A4; }
    }
    .header { background: #b40000 !important; color: #fff !important; text-align: center; padding: 18px 16px 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: #fff !important; }
    .header p { font-size: 10px; margin-top: 4px; opacity: 0.9; color: #fff !important; }
    .header hr { border: none; border-top: 1px solid rgba(255,255,255,0.5); margin: 8px 0 6px; }
    .header .subtitle { font-size: 11px; color: #fff !important; }
    .content { padding: 20px 24px 60px; max-width: 700px; margin: 0 auto; }
    h3 { font-size: 13px; font-weight: 700; color: #282828; margin: 20px 0 4px; }
    hr.section { border: none; border-top: 2px solid #b40000 !important; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td { padding: 7px 10px; border: 1px solid #ddd !important; }
    td:first-child { font-weight: 600; width: 45%; background: #f9f9f9 !important; color: #555 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .highlight td:last-child { font-weight: 700; color: #b40000 !important; }
    .footer { text-align: center; font-size: 9px; color: #999; margin-top: 32px; border-top: 1px solid #eee; padding-top: 10px; }
    .print-btn { display: block; margin: 20px auto; padding: 10px 28px; background: #b40000; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-family: inherit; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RAPID CONSULTANCY</h1>
    <p>${branchInfo.name} &nbsp;|&nbsp; ${branchInfo.address}</p>
    <p>${branchInfo.email} &nbsp;|&nbsp; ${branchInfo.phone}</p>
    <hr/>
    <span class="subtitle">Customer Statement</span>
  </div>
  <div class="content">
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    <h3>Customer Information</h3>
    <hr class="section"/>
    <table>
      ${row('Name', customer.name)}
      ${row('Date of Birth', customer.dob || 'N/A')}
      ${row('Mobile', customer.mobile)}
      ${row('Email', customer.email)}
      ${row('Address', customer.address || 'N/A')}
      ${row('Branch', branchInfo.name)}
      ${row('KYC Status', customer.kycStatus)}
      ${row('Joined Date', customer.joinedDate || 'N/A')}
      ${processingFee > 0 ? row('Processing Fee', `Rs. ${processingFee.toLocaleString('en-IN')}`) : ''}
    </table>
    ${loanSection}
    <div class="footer">
      Generated on ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; ${branchInfo.name} &nbsp;|&nbsp; ${branchInfo.email}
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
};
