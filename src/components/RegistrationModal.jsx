import React, { useState } from 'react';
import { X, CheckCircle2, User, Mail, Phone, Building, Plus, Trash2, ShieldCheck, QrCode, ArrowRight } from 'lucide-react';
import { centralApi } from '../api/centralApi';

export default function RegistrationModal({ event, onClose }) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    phone: '',
    college: 'Aditya University',
    department: 'CSE',
    year: '3rd Year',
    teamName: '',
    teamMembers: []
  });

  const isTeam = event?.participation?.type === 'TEAM';
  const maxMembers = event?.participation?.maxTeamSize || 4;

  const handleAddMember = () => {
    if (formData.teamMembers.length < maxMembers - 1) {
      setFormData({
        ...formData,
        teamMembers: [...formData.teamMembers, { name: '', rollNumber: '', email: '', phone: '' }]
      });
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...formData.teamMembers];
    updated[index][field] = value;
    setFormData({ ...formData, teamMembers: updated });
  };

  const handleRemoveMember = (index) => {
    const updated = formData.teamMembers.filter((_, i) => i !== index);
    setFormData({ ...formData, teamMembers: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        eventId: event?._id,
        eventSlug: event?.slug,
        eventTitle: event?.title,
        typeCode: 'VEDA',
        participant: {
          name: formData.name,
          rollNumber: formData.rollNumber,
          email: formData.email,
          phone: formData.phone,
          college: formData.college,
          department: formData.department,
          year: formData.year
        },
        teamName: isTeam ? formData.teamName : undefined,
        teamMembers: isTeam ? formData.teamMembers : undefined,
        fee: event?.fee
      };

      const res = await centralApi.submitRegistration(payload);
      if (res.success) {
        setSuccessData(res.data);
      }
    } catch (err) {
      alert(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="veda-modal-overlay" onClick={onClose}>
      <div className="veda-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-main)'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase' }}>
              VEDA 2k26 • Registration Desk
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              {event?.title || 'Event Registration'}
            </h3>
          </div>
          <button className="modal-close-btn" style={{ position: 'static' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body-pad">
          {successData ? (
            /* Success Confirmation Screen */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Registration Confirmed!</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.95rem' }}>
                You have successfully registered for <strong>{event?.title}</strong> in VEDA 2k26.
              </p>

              {/* Registration Pass Ticket Box */}
              <div style={{
                background: 'var(--bg-main)',
                border: '2px dashed #0284c7',
                borderRadius: '12px',
                padding: '20px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reg ID:</span>
                  <span style={{ fontWeight: '800', fontFamily: 'Space Grotesk', color: '#0284c7' }}>{successData.registrationNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lead Participant:</span>
                  <span style={{ fontWeight: '700' }}>{formData.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Venue & Reporting:</span>
                  <span style={{ fontWeight: '600' }}>
                    {typeof event?.venue === 'object' ? (event?.venue?.name || event?.venue?.address || 'Aditya University Campus') : (event?.venue || 'Aditya University Campus')}
                  </span>
                </div>
              </div>

              <button onClick={onClose} className="btn-primary" style={{ marginTop: '10px' }}>
                <span>Back to Events Catalog</span>
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {isTeam && (
                <div className="form-group">
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberKnights"
                    className="form-control"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">{isTeam ? 'Team Lead Name *' : 'Full Name *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Roll Number / Student ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21A91A0501"
                    className="form-control"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@aditya.ac.in"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Mobile No *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile number"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">College / University *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-control"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="CSE">CSE / AI & ML / Data Science</option>
                    <option value="IT">Information Technology</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">Mechanical Engineering</option>
                    <option value="CIVIL">Civil Engineering</option>
                    <option value="AGRI">Agricultural Engineering</option>
                    <option value="PHARMACY">Pharmacy / Management</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Team Members Section */}
              {isTeam && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Additional Team Members ({formData.teamMembers.length} / {maxMembers - 1})
                    </label>
                    {formData.teamMembers.length < maxMembers - 1 && (
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="btn-outline"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      >
                        <Plus size={14} /> Add Member
                      </button>
                    )}
                  </div>

                  {formData.teamMembers.map((member, index) => (
                    <div key={index} style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={`Member ${index + 2} Name`}
                        required
                        className="form-control"
                        style={{ flex: 1 }}
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Roll No"
                        required
                        className="form-control"
                        style={{ width: '130px' }}
                        value={member.rollNumber}
                        onChange={(e) => handleMemberChange(index, 'rollNumber', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}
              >
                {loading ? 'Submitting Registration...' : 'Complete Registration'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
