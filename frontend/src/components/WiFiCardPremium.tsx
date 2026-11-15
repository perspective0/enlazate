import React, { useState } from 'react';
import { Wifi, Copy } from 'lucide-react';
import './WiFiCardPremium.css';

interface WiFiCardPremiumProps {
  network?: string;
  password?: string;
  /** background gradient or color */
  background?: string;
  /** icon & text color */
  color?: string;
}

export const WiFiCardPremium: React.FC<WiFiCardPremiumProps> = ({
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

  // Encode data for QR code (WPA2 standard format)
  const qrData = `WIFI:T:WPA;S:${network};P:${password};;`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    qrData,
  )}`;

  return (
    <section className="wifi-card-premium" style={{ background }}>
      <div className="wifi-header" style={{ color }}>
        <Wifi size={48} className="wifi-icon" />
        <h2 className="wifi-network">{network}</h2>
      </div>
      <div className="wifi-body">
        <p className="wifi-label">Contraseña</p>
        <div className="wifi-pass-wrapper">
          <code className="wifi-pass">{password}</code>
          <button
            aria-label="Copiar contraseña"
            className="wifi-copy-btn"
            onClick={handleCopy}
          >
            <Copy size={18} />
          </button>
        </div>
        {copied && <div className="wifi-copied-notice">¡Copiada!</div>}
        <div className="wifi-qr-section">
          <p className="wifi-label">Escanea para conectar</p>
          <img src={qrUrl} alt="Código QR Wi‑Fi" className="wifi-qr" />
        </div>
      </div>
    </section>
  );
};
