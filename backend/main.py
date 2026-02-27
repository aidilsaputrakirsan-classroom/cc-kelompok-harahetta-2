from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Cloud App API",
    description="API untuk mata kuliah Komputasi Awan",
    version="0.1.0"
)

# CORS - agar frontend bisa akses API ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Untuk development saja
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Hello from Cloud App API!",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/team")
def team_info():
    return {
        "team": "cloud-team-harahetta-2",
        "members": [
            # TODO: Isi dengan data tim Anda
            {"name": "Djaky Abbyyu Fauzan Timumum", "nim": "10231032", "role": "Lead Backend"},
            {"name": "Achmad Zaki Zaidan", "nim": "10231002", "role": "Lead Frontend"},
            {"name": "Muhammad Alif Setiawan", "nim": "10231056", "role": "Lead DevOps"},
            {"name": "Riqqah Khalda Karina", "nim": "10231082", "role": "Lead QA & Docs"},
        ]
    }