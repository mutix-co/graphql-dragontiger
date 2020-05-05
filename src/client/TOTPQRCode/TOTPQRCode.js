import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode/lib/browser';

export default function TOTPQRCode(props) {
  const {
    className, user, service, secret, errorCorrectionLevel,
  } = props;
  const [image, setImage] = useState();

  useEffect(() => {
    const value = `otpauth://totp/${service}:${user}?secret=${secret}&issuer=${service}`;
    QRCode.toDataURL(value, { errorCorrectionLevel }, (err, url) => setImage(url));
  }, [service, user, secret, errorCorrectionLevel]);

  return (
    <div className={className}>
      <img className="image" src={image} alt="Qrcode form Two-factor Authentication" />
      <div className="secret">{secret}</div>
    </div>
  );
}

TOTPQRCode.propTypes = {
  className: PropTypes.string,
  user: PropTypes.string.isRequired,
  service: PropTypes.string.isRequired,
  secret: PropTypes.string.isRequired,
  errorCorrectionLevel: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
};

TOTPQRCode.defaultProps = {
  className: undefined,
  errorCorrectionLevel: 'M',
};
