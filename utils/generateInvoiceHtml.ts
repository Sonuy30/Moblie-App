/**
 * utils/generateInvoiceHtml.ts
 *
 * Generates a GST-compliant HTML invoice string for PDF rendering.
 * CGST + SGST are each 9% (total 18% GST).
 * HSN code used: 7213 (Steel bars & rods, hot-rolled).
 */

import type { EcomOrder } from '@/api/orders';

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'AITS Shop';

interface InvoiceCompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  phone: string;
  email?: string;
}

const DEFAULT_COMPANY: InvoiceCompanyInfo = {
  name: companyName,
  address: 'Industrial Area, Sector 5',
  city: 'Lucknow',
  state: 'Uttar Pradesh',
  pincode: '226001',
  gstin: '09AABCA1234Z1ZC',
  phone: '+91-9876543210',
  email: 'info@aitsshop.in',
};

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function generateInvoiceHtml(
  order: EcomOrder,
  company: InvoiceCompanyInfo = DEFAULT_COMPANY
): string {
  const subtotal = order.subtotal ?? 0;
  const gstAmount = order.gstAmount ?? 0;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const deliveryCharge = order.deliveryCharge ?? 0;
  const totalAmount = order.totalAmount ?? 0;
  const orderDate = formatDate(order.placedAt || order.createdAt || new Date().toISOString());
  const invoiceNo = `INV-${order.orderNumber || order._id?.slice(-8).toUpperCase()}`;

  const addr = order.deliveryAddress;
  const addrLines = addr
    ? [
        addr.fullName,
        addr.addressLine1,
        addr.addressLine2 || '',
        `${addr.city}, ${addr.state} - ${addr.pincode}`,
        addr.phone ? `Ph: ${addr.phone}` : '',
      ]
        .filter(Boolean)
        .join('<br/>')
    : 'N/A';

  const itemRows = (order.items || [])
    .map((item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemGst = itemSubtotal * 0.18;
      const itemCgst = itemGst / 2;
      const itemSgst = itemGst / 2;
      return `
        <tr>
          <td>${item.name}</td>
          <td style="text-align:center">7213</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${formatINR(item.price)}</td>
          <td style="text-align:right">${formatINR(itemSubtotal)}</td>
          <td style="text-align:right">${formatINR(itemCgst)}<br/><small>(9%)</small></td>
          <td style="text-align:right">${formatINR(itemSgst)}<br/><small>(9%)</small></td>
          <td style="text-align:right">${formatINR(itemSubtotal + itemGst)}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tax Invoice – ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a18; background: #fff; padding: 32px; }
    h1 { font-size: 22px; color: #185FA5; font-weight: 800; letter-spacing: 0.5px; }
    h2 { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #185FA5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #185FA5; padding-bottom: 16px; margin-bottom: 20px; }
    .company-info { flex: 1; }
    .company-info p { font-size: 11px; color: #5F5E5A; line-height: 1.6; }
    .invoice-meta { text-align: right; }
    .invoice-meta p { font-size: 11px; margin-bottom: 2px; }
    .invoice-meta strong { font-size: 13px; color: #185FA5; }
    .badge { display: inline-block; background: #185FA5; color: white; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 4px; letter-spacing: 1px; margin-bottom: 8px; }
    .addresses { display: flex; gap: 24px; margin-bottom: 20px; }
    .address-box { flex: 1; background: #F8F9FA; border-radius: 8px; padding: 12px; border-left: 3px solid #185FA5; }
    .address-box p { font-size: 11px; color: #5F5E5A; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    thead tr { background: #185FA5; color: white; }
    thead th { padding: 8px 6px; text-align: left; font-weight: 700; font-size: 11px; }
    tbody tr:nth-child(even) { background: #F8F9FA; }
    tbody td { padding: 8px 6px; border-bottom: 1px solid #E8E5DC; vertical-align: top; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table td { padding: 5px 6px; font-size: 12px; }
    .totals-table .label { color: #5F5E5A; }
    .totals-table .amount { text-align: right; font-weight: 500; }
    .totals-table .grand-total td { font-size: 14px; font-weight: 800; color: #185FA5; border-top: 2px solid #185FA5; padding-top: 8px; }
    .footer { margin-top: 32px; border-top: 1px solid #E8E5DC; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; color: #9E9C96; }
    .sign-area { text-align: right; }
    .sign-area .sig-line { border-top: 1px solid #1a1a18; width: 160px; margin: 40px 0 4px auto; }
    small { color: #9E9C96; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${company.name}</h1>
      <p>${company.address}<br/>${company.city}, ${company.state} – ${company.pincode}</p>
      <p>GSTIN: <strong>${company.gstin}</strong></p>
      <p>Ph: ${company.phone}${company.email ? ` &nbsp;|&nbsp; ${company.email}` : ''}</p>
    </div>
    <div class="invoice-meta">
      <div class="badge">TAX INVOICE</div>
      <p><strong>${invoiceNo}</strong></p>
      <p>Date: ${orderDate}</p>
      <p>Order: <strong>${order.orderNumber || '—'}</strong></p>
      <p>Payment: ${order.paymentMethod || 'Online'}</p>
    </div>
  </div>

  <div class="addresses">
    <div class="address-box">
      <h2>Bill To</h2>
      <p>${addrLines}</p>
    </div>
    <div class="address-box">
      <h2>Ship To</h2>
      <p>${addrLines}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30%">Item Description</th>
        <th style="text-align:center">HSN</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Subtotal</th>
        <th style="text-align:right">CGST</th>
        <th style="text-align:right">SGST</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${deliveryCharge > 0 ? `
      <tr>
        <td>Shipping Charges</td>
        <td style="text-align:center">9965</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">${formatINR(deliveryCharge)}</td>
        <td style="text-align:right">${formatINR(deliveryCharge)}</td>
        <td style="text-align:right">—</td>
        <td style="text-align:right">—</td>
        <td style="text-align:right">${formatINR(deliveryCharge)}</td>
      </tr>` : ''}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tbody>
        <tr><td class="label">Items Subtotal</td><td class="amount">${formatINR(subtotal)}</td></tr>
        <tr><td class="label">CGST (9%)</td><td class="amount">${formatINR(cgst)}</td></tr>
        <tr><td class="label">SGST (9%)</td><td class="amount">${formatINR(sgst)}</td></tr>
        ${deliveryCharge > 0 ? `<tr><td class="label">Shipping</td><td class="amount">${formatINR(deliveryCharge)}</td></tr>` : ''}
        <tr class="grand-total"><td>Grand Total</td><td class="amount">${formatINR(totalAmount)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>
      <p><strong>Terms &amp; Conditions:</strong></p>
      <p>Goods once sold will not be taken back or exchanged unless within return policy window.</p>
      <p>This is a computer-generated invoice. No signature required.</p>
    </div>
    <div class="sign-area">
      <div class="sig-line"></div>
      <p>Authorised Signatory</p>
      <p><strong>${company.name}</strong></p>
    </div>
  </div>
</body>
</html>`;
}
