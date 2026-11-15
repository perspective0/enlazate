import React, { useState } from 'react';
import { Wifi, Copy } from 'lucide-react';
import './WiFiCardNew.css';

interface WiFiCardNewProps {
  network?: string;
  password?: string;
  /**
   * Background can be a CSS gradient or solid color.
   */
  background?: string;
  /** Icon and text color */
  color?: string;
}

export const WiFiCardNew: React.FC<WiFiCardNewProps> = ({
  network = 'Wi‑Fi',
  password = 'Consulta al personal',
  background = 'linear-gradient(135deg, #e0f7ff, #b3e5fc)',
  color = '#0277bd',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!password) return;
    void navigator.clipboard?.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <section className="wifi-card-new" style={{ background }}>
      <div className="wifi-header" style={{ color }}>
        <Wifi size={48} className="wifi-icon" />
        <h2 className="wifi-network">{network}</h2>
      </div>
      <div className="wifi-body">
        <p className="wifi-label">Contraseña</p>
        <div className="wifi-pass-wrapper">
          <code className="wifi-pass">{password}</code>
          {password && (
            <button
              aria-label="Copiar contraseña"
              className="wifi-copy-btn"
              onClick={handleCopy}
            >
              <Copy size={18} />
            </button>
          )}
        </div>
        {copied && <div className="wifi-copied-notice">¡Copiada!</div>}
      </div>
    </section>
  );
};
