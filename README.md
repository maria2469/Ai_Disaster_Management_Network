🚨 AI Disaster Management Network

The AI Disaster Management Network is a real-time emergency response system designed to quickly connect people in distress with nearby trained volunteers using AI, geolocation, and automated communication systems.

The platform enables users to report emergencies through a simple interface by submitting a message and their location. Once an incident is reported, an AI-powered backend system classifies the type of emergency (such as medical, fire, accident, or crime) and stores it in a centralized database.

After classification, the system automatically identifies nearby volunteers based on:

Geographic proximity (using Haversine distance calculation)
Skill matching (e.g., medical emergencies are routed to doctors, nurses, or paramedics)
Availability status

Once suitable responders are found, the system sends real-time alerts through WhatsApp using the UltraMsg API, providing them with incident details and live location links. If no volunteer responds within a specific time window, the system automatically expands the search radius and re-alerts additional responders.

A real-time dashboard (powered by WebSockets) broadcasts emergency updates instantly, allowing coordinated response and monitoring of active incidents.

🔑 Key Features

AI-based emergency classification
Real-time incident reporting system
Geo-location based volunteer matching
Skill-based responder filtering
Automated WhatsApp alert system
Timeout-based escalation (wider area re-alerting)
Live incident broadcasting via WebSockets
Scalable backend built with FastAPI + LangGraph
Supabase database integration for real-time storage

🛠️ Tech Stack

Frontend: React / JavaScript
Backend: FastAPI (Python)
AI Layer: LangGraph + NLP-based classifier
Database: Supabase (PostgreSQL)
Real-time Communication: WebSockets
Messaging: UltraMsg WhatsApp API
Geo-matching: Haversine distance algorithm

🎯 Objective

The goal of this project is to reduce emergency response time by intelligently connecting victims with the nearest qualified volunteers, ensuring faster coordination, better resource allocation, and improved survival outcomes during critical situations.
