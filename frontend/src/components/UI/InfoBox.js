import React from 'react';
import './InfoBox.css';

const InfoBox = ({ 
  children, 
  className = '', 
  icon = null, 
  title = null, 
  variant = 'default',
  ...props 
}) => {
  return (
    <div className={`ui-info-box ${variant} ${className}`} {...props}>
      {icon && (
        <div className="info-box-icon">
          {typeof icon === 'string' ? <i className={icon}></i> : icon}
        </div>
      )}
      <div className="info-box-content">
        {title && <h4 className="info-box-title">{title}</h4>}
        <div className="info-box-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoBox;