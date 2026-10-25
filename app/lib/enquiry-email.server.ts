type Enquiry = { name: string; businessName: string; email: string; message: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, character =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character
  );

export function enquiryNotification(enquiry: Enquiry, id: string) {
  const reference = id.slice(0, 8).toUpperCase();
  const cleanBusiness = enquiry.businessName.replace(/[\r\n\t]+/g, " ").slice(0, 90);
  const subject = "New HUMMIN enquiry: " + cleanBusiness;
  const name = escapeHtml(enquiry.name);
  const business = escapeHtml(enquiry.businessName);
  const email = escapeHtml(enquiry.email);
  const message = escapeHtml(enquiry.message).replace(/\r\n|\r|\n/g, "<br>");
  const replyUrl = "mailto:" + encodeURIComponent(enquiry.email);
  const text = [
    "NEW HUMMIN WEBSITE ENQUIRY", "",
    "Business: " + enquiry.businessName,
    "Name: " + enquiry.name,
    "Email: " + enquiry.email, "",
    "WHAT THEY WOULD LIKE TO WORK ON", enquiry.message, "",
    "Reply to this message to contact the sender.",
    "Reference: " + reference
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New HUMMIN enquiry</title></head>
<body style="margin:0;padding:0;background:#F4F5F1;color:#1E272A;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;font-size:1px;line-height:1px;color:#F4F5F1;max-height:0;max-width:0;opacity:0;overflow:hidden">New website enquiry from ${business}. Reply to this email to follow up.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#F4F5F1"><tr><td align="center" style="padding:32px 16px 48px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border-collapse:collapse">
<tr><td style="background:#1E272A;padding:28px 36px 26px">
  <span style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;letter-spacing:3px;color:#F4F5F1">HUMMIN</span>
  <div style="margin-top:21px;font-size:11px;line-height:1.4;letter-spacing:2px;font-weight:bold;color:#E7EBE6">NEW WEBSITE ENQUIRY</div>
</td></tr>
<tr><td style="height:4px;background:#B5532C;font-size:1px;line-height:4px">&nbsp;</td></tr>
<tr><td style="background:#FFFFFF;padding:38px 36px 35px">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;line-height:1.13;letter-spacing:-0.6px;margin:0 0 13px;color:#1E272A">A business has reached out.</h1>
  <p style="font-family:Arial,Helvetica,sans-serif;color:#5E6967;font-size:14px;line-height:1.7;margin:0 0 32px">An enquiry was submitted through the HUMMIN website.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
    <tr><td style="padding:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#65716E">BUSINESS</td></tr>
    <tr><td style="padding:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:#1E272A;overflow-wrap:anywhere">${business}</td></tr>
    <tr><td style="border-top:1px solid #D0D8D2;padding:20px 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#65716E">CONTACT</td></tr>
    <tr><td style="padding:0 0 4px;font-size:16px;font-weight:bold;line-height:1.5;color:#1E272A;overflow-wrap:anywhere">${name}</td></tr>
    <tr><td style="padding:0 0 26px;font-size:14px;line-height:1.6;color:#B5532C;overflow-wrap:anywhere">${email}</td></tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#F4F5F1">
  <tr><td style="border-left:3px solid #B5532C;padding:22px 23px 24px">
    <div style="font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#65716E;margin:0 0 12px">WHAT THEY WOULD LIKE TO WORK ON</div>
    <div style="font-size:15px;line-height:1.75;color:#1E272A;overflow-wrap:anywhere">${message}</div>
  </td></tr></table>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:28px">
  <tr><td bgcolor="#B5532C" style="border-radius:5px">
    <a href="${escapeHtml(replyUrl)}" style="display:inline-block;padding:15px 25px;font-size:14px;line-height:1.2;font-weight:bold;text-decoration:none;color:#FFFFFF">Reply to enquiry</a>
  </td></tr></table>
  <p style="font-size:12px;line-height:1.7;color:#65716E;margin:17px 0 0">You can also reply directly to this email. The sender's address is already set as Reply-To.</p>
</td></tr>
<tr><td style="padding:21px 5px 0;font-size:11px;line-height:1.7;color:#65716E">
  HUMMIN website enquiry &nbsp;&middot;&nbsp; Reference ${reference}<br>
  Internal notification sent to sales@hummin.org
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
