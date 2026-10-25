import test from 'node:test';
import assert from 'node:assert/strict';
import { enquiryNotification } from '../app/lib/enquiry-email.server.ts';

test('HUMMIN enquiry email is branded, readable, and replies to the sender', () => {
  const email = enquiryNotification({
    name: 'Jane Otieno',
    businessName: 'Nairobi Supply Co.',
    email: 'jane@example.com',
    message: 'We need better inventory control.\nOur team is growing.'
  }, '12345678-1234-4000-8000-123456789abc');

  assert.equal(email.subject, 'New HUMMIN enquiry: Nairobi Supply Co.');
  assert.match(email.html, /HUMMIN/);
  assert.match(email.html, /Nairobi Supply Co\./);
  assert.match(email.html, /WHAT THEY WOULD LIKE TO WORK ON/);
  assert.match(email.html, /Reply to enquiry/);
  assert.match(email.html, /mailto:jane%40example.com/);
  assert.match(email.html, /control\.<br>Our team/);
  assert.match(email.text, /inventory control\.\nOur team/);
  assert.match(email.html, /12345678/);
  assert.ok(!email.html.includes('—'));
});

test('Enquiry values are escaped in HTML and preserved in plain text', () => {
  const email = enquiryNotification({
    name: 'Alice <script>',
    businessName: 'A & B <Partners>',
    email: 'alice@example.com',
    message: '<script>alert("x")</script> & a question'
  }, 'abcdef12-0000-4000-8000-000000000000');
  assert.ok(!email.html.includes('<script>alert'));
  assert.match(email.html, /Alice &lt;script&gt;/);
  assert.match(email.html, /A &amp; B &lt;Partners&gt;/);
  assert.match(email.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; a question/);
  assert.match(email.text, /<script>alert/);
  assert.match(email.subject, /A & B <Partners>/);
});

test('Business name cannot introduce new lines into email subject', () => {
  const email = enquiryNotification({
    name: 'Sam',
    businessName: 'One Company\r\nUnexpected header',
    email: 'sam@example.com',
    message: 'Test message'
  }, '12ab34cd-0000-4000-8000-000000000000');
  assert.ok(!email.subject.includes('\n'));
  assert.ok(!email.subject.includes('\r'));
});
