import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle } from 'lucide-react';

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', query: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" style={{ padding: '80px 0', background: 'var(--bg-main)' }}>
      <div className="veda-container">
        <div className="section-header-wrap">
          <span className="section-badge">CONNECT WITH US</span>
          <h2 className="section-main-title">Fest Helpdesk & Location</h2>
          <p className="section-subtext">Have questions regarding registration, paper submissions, or transport? Reach out to us.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'flex-start' }}>
          {/* Contact Details Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '36px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' }}>Aditya University Hub</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Campus Venue</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aditya Nagar, ADB Road, Surampalem, Kakinada District, Andhra Pradesh - 533437.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Official Helpdesk</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>veda2k26@adityauniversity.in</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>centralevents@aditya.ac.in</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Helpline Numbers</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>+91 98480 12345 (Conveners Desk)</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>+91 95534 51345 (Technical Support)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Query Form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '36px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>Send Us a Message</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>We typically respond within a few hours.</p>

            {submitted ? (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#166534' }}>
                <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontWeight: '800', fontSize: '1.2rem' }}>Message Received!</h4>
                <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Our fest coordinator team will get in touch with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit number"
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Your Query / Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ask about event rules, registration issues, or accommodation..."
                    className="form-control"
                    value={form.query}
                    onChange={(e) => setForm({ ...form, query: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '12px' }}>
                  <Send size={16} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
