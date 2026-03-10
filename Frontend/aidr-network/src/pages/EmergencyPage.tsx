import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Define type for the incident object
interface Incident {
    id: number;
    message: string;
    latitude: number;
    longitude: number;
    type: string;
    status: string;
    created_at?: string;
}

export default function EmergencyPage() {
    const { id } = useParams<{ id: string }>(); // id from URL params
    const navigate = useNavigate();

    const [incident, setIncident] = useState<Incident | null>(null);
    const alarmRef = useRef<HTMLAudioElement | null>(null);

    // Fetch incident from backend
    useEffect(() => {
        if (!id) return;
        fetch(`http://localhost:8001/emergency/${id}`)
            .then((res) => res.json())
            .then((data: Incident) => setIncident(data))
            .catch((err) => console.error("Failed to fetch incident:", err));
    }, [id]);

    // Play alarm sound
    useEffect(() => {
        if (incident) {
            alarmRef.current = new Audio("/alarm.mp3");
            alarmRef.current.loop = true;
            alarmRef.current.play().catch(() => console.log("Autoplay prevented"));
        }
        return () => {
            if (alarmRef.current) alarmRef.current.pause();
        };
    }, [incident]);

    if (!incident)
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-100 font-bold text-xl bg-gradient-to-br from-red-700 via-red-600 to-red-800">
                Loading emergency...
            </div>
        );

    const handleAccept = () => {
        if (alarmRef.current) alarmRef.current.pause();
        navigate("/dashboard"); // navigate to main dashboard
    };

    const handleDecline = () => {
        if (alarmRef.current) alarmRef.current.pause();
        alert("You declined to help.");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-red-800 px-4 animate-pulse">
            <div className="bg-white rounded-3xl shadow-3xl max-w-md w-full p-6 md:p-8 text-center border-8 border-red-600">
                <div className="flex flex-col items-center">
                    <div className="text-7xl animate-bounce mb-4">🚨</div>
                    <h1 className="text-4xl font-extrabold text-red-700 mb-4 tracking-wide">
                        EMERGENCY ALERT
                    </h1>
                    <p className="text-gray-800 mb-6 font-semibold text-lg">
                        Someone nearby needs your help immediately!
                    </p>

                    <div className="bg-gradient-to-r from-red-200 via-yellow-200 to-orange-200 rounded-xl p-5 mb-6 w-full text-left border-l-8 border-red-600 shadow-lg">
                        <p className="font-bold text-red-700 mb-1">Message:</p>
                        <p className="text-gray-800 mb-2">{incident.message}</p>
                        <p className="font-bold text-red-700 mb-1">Type:</p>
                        <p className="text-gray-800">{incident.type}</p>
                        <p className="font-bold text-red-700 mt-2">Location:</p>
                        <p className="text-gray-800">
                            {incident.latitude}, {incident.longitude}
                        </p>
                    </div>

                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mb-6 inline-block bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition duration-200 shadow-lg"
                    >
                        Open Navigation
                    </a>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={handleAccept}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition duration-200 shadow-lg"
                        >
                            ACCEPT HELP
                        </button>
                        <button
                            onClick={handleDecline}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition duration-200 shadow-lg"
                        >
                            DECLINE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}