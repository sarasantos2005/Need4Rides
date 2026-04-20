import { useEffect } from 'react';
import axios from 'axios';

export default function DriverTracker() {
  useEffect(() => {
    const sendLocation = async () => {
      try {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
       
            if (isNaN(lat) || isNaN(lng)) {
              console.warn("Geolocalização retornou valores inválidos.");
              return;
            }

            try {
              const token = localStorage.getItem('token');
              await axios.post('http://localhost:3000/api/turno/posicao', 
                { lat: lat, lng: lng }, // Garante que envias números puros
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
            } catch (err) {
              console.error("Erro ao enviar localização:", err.message);
            }
          },
          
          (err) => console.error("Erro de GPS:", err)
        );
      } catch (err) {
        console.error("Erro ao enviar localização:", err);
      }
    };

    const interval = setInterval(sendLocation, 15000); 
    return () => clearInterval(interval);
  }, []);

  return null;
}