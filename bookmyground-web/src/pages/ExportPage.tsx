import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExportPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/my-bookings', { replace: true }); }, []);
  return null;
}
