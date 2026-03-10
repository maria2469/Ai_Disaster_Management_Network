import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

export default function EmergencyPage() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const alarmRef = useRef(null);

    useEffect(() => {
        fetch(`http://localhost:8001/emergency/${id}`) // your FastAPI port
            .then(res => res.json())
            .then(data => setIncident(data))
            .catch(err => console.error("Failed to fetch incident:", err));
    }, [id]);

    useEffect(() => {
        if (incident) {
            alarmRef.current = new Audio("/alarm.mp3"); // Ensure this file exists in your public folder
            alarmRef.current.loop = true;
            alarmRef.current.play().catch(() => console.log("Autoplay prevented"));
        }
        return () => {
            if (alarmRef.current) alarmRef.current.pause();
        };
    }, [incident]);

    if (!incident) return <div className="text-center mt-20">Loading emergency...</div>;

    const handleAccept = () => {
        alert("You accepted to help! Victim location shared.");
        if (alarmRef.current) alarmRef.current.pause();
    };

    const handleDecline = () => {
        alert("You declined to help.");
        if (alarmRef.current) alarmRef.current.pause();
    };

    return (
        <div className="min-h-screen bg-red-600 animate-pulse flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
                <h1 className="text-3xl font-bold text-red-600 mb-4">🚨 EMERGENCY ALERT</h1>
                <p className="text-gray-700 mb-4">Someone nearby needs help immediately.</p>

                <div className="bg-gray-100 p-4 rounded mb-4">
                    <p className="font-semibold">Message:</p>
                    <p>{incident.message}</p>
                    <p className="mt-2 font-semibold">Type:</p>
                    <p>{incident.type}</p>
                </div>

                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`}
                    target="_blank"
                    className="block bg-blue-600 text-white text-center py-3 rounded mb-4"
                >
                    Open Navigation
                </a>

                <div className="flex gap-4">
                    <button onClick={handleAccept} className="flex-1 bg-green-600 text-white py-3 rounded font-bold">
                        ACCEPT HELP
                    </button>
                    <button onClick={handleDecline} className="flex-1 bg-gray-400 text-white py-3 rounded font-bold">
                        DECLINE
                    </button>
                </div>
            </div>
        </div>
    );
}