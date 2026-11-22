# 🏋️‍♂️ DreamPhysic AI — Personal AI Fitness & Fat-Loss Tracker

<div align="center">

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-1.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-grade AI-powered fitness tracker built with Spring Boot 3, Gemini Vision API, and Neon PostgreSQL — designed for progressive overload tracking, 10K running coaching, and AI-powered meal photo scanning.**

[🚀 Getting Started](#-getting-started) • [📡 API Reference](#-api-endpoints) • [🏗️ Architecture](#️-architecture) • [🧠 AI Features](#-ai-features)

</div>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure user registration & login with BCrypt password hashing and stateless JWT tokens |
| 🏋️ **Workout Tracker** | Full CRUD for workout sessions with exercises, progressive overload tracking (previous best weight/reps) |
| 🏃 **Running Coach** | Log running sessions with distance, pace, heart rate — built for 10K stamina training |
| 🍽️ **Meal Logger** | Track meals with full macro breakdown (calories, protein, carbs, fat, fiber) |
| 📸 **AI Meal Scanner** | Snap a photo of your food → Gemini Vision AI estimates calories & macros instantly |
| 🤖 **AI Workout Advice** | Get personalized workout plans focused on progressive overload and proper form |
| 📊 **AI Diet Planning** | 1800 kcal/day fat-loss meal plans with detailed macros per meal |
| ⚡ **Virtual Threads** | Java 21 Virtual Threads for high-throughput concurrent request handling |
| 🗄️ **Connection Pooling** | HikariCP with 20 connections optimized for Neon PostgreSQL |
| 💾 **Caffeine Cache** | In-memory caching for workout data and AI responses (500 entries, 10min TTL) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DreamPhysic AI Backend                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ Workout  │  │ Running  │  │  Meals   │    │
│  │Controller│  │Controller│  │Controller│  │Controller│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │              │              │              │          │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐    │
│  │   Auth   │  │ Workout  │  │ Running  │  │  Meal    │    │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │              │              │              │          │
│       └──────────────┴──────┬───────┴──────────────┘          │
│                             │                                 │
│  ┌──────────────────────────┴───────────────────────────┐    │
│  │              Spring Data JPA Repositories             │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                             │                                 │
│  ┌──────────────┐    ┌──────┴──────┐    ┌────────────────┐   │
│  │ JWT Security │    │  HikariCP   │    │  Gemini AI     │   │
│  │   Filter     │    │  Pool (20)  │    │  Service       │   │
│  └──────────────┘    └──────┬──────┘    └───────┬────────┘   │
│                             │                    │            │
└─────────────────────────────┼────────────────────┼────────────┘
                              │                    │
                    ┌─────────┴──────┐  ┌─────────┴──────────┐
                    │ Neon PostgreSQL │  │ Gemini 1.5 Flash   │
                    │  (Cloud DB)    │  │ (Vision + Text)    │
                    └────────────────┘  └────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | Java 21 (Virtual Threads) |
| **Framework** | Spring Boot 3.4.0 |
| **Security** | Spring Security 6 + JWT (JJWT 0.12.6) |
| **Database** | Neon PostgreSQL (Serverless) |
| **ORM** | Hibernate 6.6 / Spring Data JPA |
| **Connection Pool** | HikariCP (20 max connections) |
| **Cache** | Caffeine (500 entries, 600s TTL) |
| **AI** | Google Gemini 1.5 Flash (Text + Vision) |
| **Build Tool** | Maven 3.9.x |
| **API Style** | RESTful JSON |

---

## 🚀 Getting Started

### Prerequisites

- **Java 21+** installed
- **Maven 3.9+** installed
- **Neon PostgreSQL** account ([neon.tech](https://neon.tech))
- **Google Gemini API Key** ([ai.google.dev](https://ai.google.dev))

### 1. Clone the repository

```bash
git clone https://github.com/hasansaiyyed/dreamphysic-ai.git
cd dreamphysic-ai
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
```

Update `backend/src/main/resources/application.properties`:

```properties
# PostgreSQL / Neon (JDBC format with split credentials)
spring.datasource.url=jdbc:postgresql://<host>/<database>?sslmode=require
spring.datasource.username=<username>
spring.datasource.password=<password>

# Gemini API
app.gemini.api-key=your_gemini_api_key_here
```

### 3. Build & Run

```bash
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Server starts at **http://localhost:8080**

### 4. Verify

```bash
curl http://localhost:8080/actuator/health
# → {"status":"UP","components":{"db":{"status":"UP"}}}
```

---

## 📡 API Endpoints

### 🔐 Authentication (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & get JWT token |

### 🏋️ Workouts (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workouts` | List all workouts |
| `POST` | `/api/workouts` | Create workout with exercises |
| `GET` | `/api/workouts/{id}` | Get workout details |
| `PUT` | `/api/workouts/{id}` | Update workout |
| `DELETE` | `/api/workouts/{id}` | Delete workout |

### 💪 Exercises (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/exercises/workout/{workoutId}` | List exercises for workout |
| `POST` | `/api/exercises/workout/{workoutId}` | Add exercise to workout |
| `PUT` | `/api/exercises/{id}` | Update exercise |
| `DELETE` | `/api/exercises/{id}` | Delete exercise |

### 🏃 Running Sessions (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/running-sessions` | List running sessions |
| `POST` | `/api/running-sessions` | Log new running session |
| `DELETE` | `/api/running-sessions/{id}` | Delete session |

### 🍽️ Meals (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/meals?date=2024-01-15` | Get meals for date |
| `GET` | `/api/meals/summary?date=2024-01-15` | Daily calorie/macro summary |
| `POST` | `/api/meals` | Log a meal |
| `DELETE` | `/api/meals/{id}` | Delete meal |

### 🧠 AI Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/meal-scan` | Scan food photo → calories & macros (Gemini Vision) |
| `POST` | `/api/ai/workout-advice` | Get AI workout recommendations |
| `POST` | `/api/ai/diet-plan` | Generate 1800kcal diet plan |

---

## 🧠 AI Features

### 📸 Meal Photo Scanner (Gemini Vision)

Send a base64-encoded food photo and get instant nutritional analysis:

```bash
curl -X POST http://localhost:8080/api/ai/meal-scan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "<base64_image_data>",
    "mimeType": "image/jpeg"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Chicken Biryani",
    "calories": 450,
    "proteinG": 28.5,
    "carbsG": 52.0,
    "fatG": 14.2,
    "fiberG": 3.1,
    "description": "A serving of chicken biryani with rice, spices, and herbs"
  }
}
```

### 🤖 AI Workout Advisor

```bash
curl -X POST http://localhost:8080/api/ai/workout-advice \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I can bench press 60kg for 8 reps. How do I progress to 80kg?"}'
```

### 📊 AI Diet Planner

```bash
curl -X POST http://localhost:8080/api/ai/diet-plan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Indian vegetarian diet plan for muscle gain"}'
```

---

## 📋 Request/Response Examples

### Register User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hasan",
    "email": "hasan@dreamphysic.com",
    "password": "securepass123"
  }'
```

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "type": "Bearer",
    "userId": 1,
    "email": "hasan@dreamphysic.com",
    "name": "Hasan"
  }
}
```

### Create Workout with Exercises

```bash
curl -X POST http://localhost:8080/api/workouts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Push Day - Chest & Shoulders",
    "notes": "Progressive overload focus",
    "exercises": [
      {
        "name": "Bench Press",
        "sets": 4,
        "reps": 8,
        "weightKg": 70.0,
        "restSeconds": 120,
        "muscleGroup": "CHEST"
      },
      {
        "name": "Overhead Press",
        "sets": 3,
        "reps": 10,
        "weightKg": 40.0,
        "restSeconds": 90,
        "muscleGroup": "SHOULDERS"
      }
    ]
  }'
```

---

## 📂 Project Structure

```
dreamphysic-ai/
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/gymapp/backend/
│           │   ├── BackendApplication.java
│           │   ├── config/
│           │   │   ├── AppConfig.java          # RestTemplate, ObjectMapper
│           │   │   └── SecurityConfig.java     # JWT + CORS + Spring Security
│           │   ├── controller/
│           │   │   ├── AuthController.java     # /api/auth/*
│           │   │   ├── WorkoutController.java  # /api/workouts/*
│           │   │   ├── ExerciseController.java # /api/exercises/*
│           │   │   ├── RunningController.java  # /api/running-sessions/*
│           │   │   ├── MealController.java     # /api/meals/*
│           │   │   └── AiController.java       # /api/ai/*
│           │   ├── dto/                        # Request/Response DTOs
│           │   ├── entity/                     # JPA Entities
│           │   ├── exception/                  # Global Exception Handler
│           │   ├── repository/                 # Spring Data JPA Repos
│           │   ├── security/                   # JWT Filter & Utility
│           │   └── service/                    # Business Logic + Gemini AI
│           └── resources/
│               └── application.properties
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔒 Security

- **Password Hashing**: BCrypt with Spring Security's `PasswordEncoder`
- **JWT Tokens**: HMAC-SHA384 signed, 24-hour expiration
- **Stateless Sessions**: No server-side session storage
- **CORS**: Configured for frontend origins
- **SQL Injection**: Protected via Spring Data JPA parameterized queries
- **Input Validation**: Jakarta Bean Validation on all DTOs

---

## ⚡ Performance Optimizations

- **Virtual Threads** (Java 21) — handles thousands of concurrent requests without thread pool bottlenecks
- **HikariCP** — 20 connection pool tuned for Neon PostgreSQL's connection limits
- **Caffeine Cache** — workout lists and AI responses cached (500 entries, 10min TTL)
- **Lazy Loading** — JPA associations use `FetchType.LAZY` to prevent N+1 queries
- **Connection Pooling** — SSL-enabled connections with keep-alive for Neon's pooler endpoint

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Hasan Saiyyed**

- GitHub: [@hasansaiyyed](https://github.com/hasansaiyyed)
- Email: hasansaiyyed1990@gmail.com

---

<div align="center">

**Built with ❤️ and 💪 for the fitness community**

*"Your body can stand almost anything. It's your mind you have to convince."*

</div>
