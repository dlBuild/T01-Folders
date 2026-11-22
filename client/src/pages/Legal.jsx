import { Link, useParams, Navigate } from 'react-router-dom';

/**
 * Public policy pages. Cashfree reviews these before approving your domain for live payments
 * (Contact Us, Terms and Conditions, Refunds and Cancellations), so they must open WITHOUT login.
 *
 * >>> BEFORE GOING LIVE: set the real contact details below (or via VITE_* variables at build time)
 * >>> and have the wording checked against how you actually sell and refund.
 */
const CONTACT = {
  business: import.meta.env.VITE_BUSINESS_NAME || 'Project T01',
  email: import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com',
  phone: import.meta.env.VITE_SUPPORT_PHONE || '+91 00000 00000',
  address: import.meta.env.VITE_BUSINESS_ADDRESS || 'Your registered business address, City, State, PIN, India',
};

const P = ({ children }) => <p className="leading-relaxed text-navy-800/80">{children}</p>;
const H = ({ children }) => <h2 className="text-xl font-extrabold mt-8 mb-2">{children}</h2>;

const PAGES = {
  contact: {
    title: 'Contact us',
    body: (
      <>
        <P>Questions about a product, your account or a payment? Write to us and we will reply within 2 working days.</P>
        <div className="card p-6 mt-6 space-y-2">
          <p><strong>{CONTACT.business}</strong></p>
          <p>Email: <a className="text-sky-brand font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
          <p>Phone: {CONTACT.phone}</p>
          <p>Address: {CONTACT.address}</p>
        </div>
      </>
    ),
  },
  terms: {
    title: 'Terms and Conditions',
    body: (
      <>
        <P>By creating an account or buying from {CONTACT.business} you agree to these terms.</P>
        <H>What we sell</H>
        <P>We sell digital e-books and learning resources that you read online in your account. No physical item is shipped. All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise.</P>
        <H>Your account</H>
        <P>You are responsible for keeping your password safe. Access to a purchased product is personal to your account and must not be shared, resold or copied.</P>
        <H>Access after purchase</H>
        <P>Access is granted automatically once the payment is confirmed by our payment partner, Cashfree Payments. If your payment is debited but access does not appear within a few minutes, contact us with your order ID.</P>
        <H>Content</H>
        <P>The content is for learning purposes and does not guarantee a job, admission or any specific career outcome. All content remains the property of {CONTACT.business}.</P>
        <H>Changes</H>
        <P>We may update these terms or our content from time to time. Continued use of the site means you accept the updated terms.</P>
        <P>See also our <Link to="/refund-policy" className="text-sky-brand font-semibold underline">Refunds and Cancellations</Link> and <Link to="/privacy" className="text-sky-brand font-semibold underline">Privacy Policy</Link>.</P>
      </>
    ),
  },
  'refund-policy': {
    title: 'Refunds and Cancellations',
    body: (
      <>
        <P>Because our products are digital and unlocked instantly after payment, an order cannot be cancelled once access has been granted. We still want you to be happy, so:</P>
        <H>When we refund</H>
        <P>If you were charged more than once for the same product, or you were charged and the product did not unlock, we will refund the affected amount in full (or unlock the product, if you prefer).</P>
        <H>Failed payments</H>
        <P>If a payment fails, the amount is not kept by us. If your bank has debited the amount, it is normally returned by the bank/payment partner automatically within 5-7 working days.</P>
        <H>How to ask</H>
        <P>Email <a className="text-sky-brand font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> with your order ID within 7 days of purchase. Approved refunds go back to the original payment method.</P>
      </>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <P>We collect only what we need to run your account and take payments.</P>
        <H>What we collect</H>
        <P>Your name, email, mobile number, an encrypted (hashed) password, your reading progress, and your order history.</P>
        <H>How we use it</H>
        <P>To sign you in, unlock the products you buy, process payments through Cashfree Payments (they receive your name, email, phone and order amount), and send account and order emails. We do not sell your data.</P>
        <H>Cookies</H>
        <P>We use one secure, essential cookie to keep you signed in. We do not use advertising cookies.</P>
        <H>Your choices</H>
        <P>You can ask us to correct or delete your account by writing to <a className="text-sky-brand font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. Order records may be kept as required for accounting.</P>
      </>
    ),
  },
};

export default function Legal({ page }) {
  const p = PAGES[page];
  if (!p) return <Navigate to="/" replace />;
  return (
    <div className="container-t01 py-16 max-w-3xl">
      <span className="section-tag">{CONTACT.business}</span>
      <h1 className="text-4xl font-extrabold mb-6">{p.title}</h1>
      {p.body}
    </div>
  );
}
