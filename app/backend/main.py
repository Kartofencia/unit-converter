from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import logic

#app initialization
app = FastAPI()

#CORS allowed domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#included routers
app.include_router(logic.router)