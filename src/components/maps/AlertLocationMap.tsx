import React from 'react';

interface AlertLocationMapProps {
  latitude: number;
  longitude: number;
  height?: string;
}

const AlertLocationMap: React.FC<AlertLocationMapProps> = ({ 
  latitude, 
  longitude, 
  height = '300px' 
}) => {
  // Google Maps embed URL with marker
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <iframe
      width="100%"
      height={height}
      frameBorder="0"
      scrolling="no"
      marginHeight={0}
      marginWidth={0}
      src={mapUrl}
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
};

export default AlertLocationMap;
