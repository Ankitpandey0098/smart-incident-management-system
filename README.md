🚨 Smart Incident Management System

An AI-powered Smart Incident Management System that allows users to report incidents, automatically classify severity using Machine Learning, notify departments, and track resolution status in real-time.

📌 Features
👤 User Features
Report incidents with image upload
Automatic severity prediction using AI
Track incident status
Real-time incident updates
Location-based incident reporting
Email notifications
🏢 Department Features
Department dashboard
Update incident status
Assign priority
Mark incidents resolved
Receive email alerts
👨‍💼 Admin Features
View all incidents
Analytics dashboard
Incident heatmap
Live incident feed
Department management
User management
🤖 AI Features
Incident severity prediction
Emergency detection model
Text classification
Automated incident categorization
🛠 Tech Stack
Frontend
React.js
React Bootstrap
Axios
Chart.js
Backend
Django
Django REST Framework
JWT Authentication
Database
SQLite (Development)
MySQL (Production Ready)
Machine Learning
Scikit-learn
TF-IDF Vectorizer
Trained ML Model (.pkl)
🗂 Project Structure
incident-platform
│
├── backend
│   ├── incidents
│   ├── incident_api
│   └── media
│
├── frontend
│   └── incident-frontend
│
└── README.md

🚀 Installation Guide
Backend Setup
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Frontend Setup
cd frontend/incident-frontend
npm install
npm start

📊 System Architecture

User → React Frontend → Django REST API → ML Model → Database

📸 Screenshots

(Add screenshots here)

Login Page
Dashboard
Incident Report
Admin Dashboard
Heatmap
🔐 Authentication
JWT Authentication
Role Based Access
Admin / Department / User
📈 Future Enhancements
Mobile App
SMS Notifications
Real-time WebSocket Alerts
AI Image Detection
Google Maps Integration
👨‍💻 Author

Ankit Pandey

Smart Incident Management System
Final Year Project
