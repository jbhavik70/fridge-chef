import json
import os
import base64
import sqlite3
import re
from datetime import datetime
from contextlib import contextmanager, asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from google import genai
from google.genai import types
from dotenv import load_dotenv

from prompts import SYSTEM_PROMPT_TEXT, SYSTEM_PROMPT_IMAGE

load_dotenv()

def get_db_path():
    return os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "bookings.db"))

@contextmanager
def get_db_conn():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                leftovers TEXT NOT NULL,
                recipe_title TEXT,
                guests INTEGER NOT NULL DEFAULT 2,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Fridge Chef", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL = "gemini-3.5-flash"
IMAGE_MODEL = "imagen-3.0-generate-002" 

def _create_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key)
    # Fallback to Vertex AI if needed, though mostly using API key
    return genai.Client(
        vertexai=True,
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )

class BookingCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str
    phone: str | None = None
    leftovers: str = Field(..., min_length=1)
    recipe_title: str | None = None
    guests: int = Field(default=2, ge=1)
    date: str
    time: str
    notes: str | None = None

    @field_validator("name")
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()

    @field_validator("email")
    def validate_email(cls, v):
        v = v.strip()
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("leftovers")
    def validate_leftovers(cls, v):
        if not v.strip():
            raise ValueError("Leftovers cannot be empty or whitespace")
        return v.strip()

    @field_validator("date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v

    @field_validator("time")
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Time must be in HH:MM format")
        return v

@app.post("/api/bookings", status_code=201)
async def create_booking(booking: BookingCreate):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO bookings (
                    name, email, phone, leftovers, recipe_title, guests, date, time, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    booking.name,
                    booking.email,
                    booking.phone,
                    booking.leftovers,
                    booking.recipe_title,
                    booking.guests,
                    booking.date,
                    booking.time,
                    booking.notes
                )
            )
            conn.commit()
            booking_id = cursor.lastrowid
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=500, detail="Failed to retrieve created booking")
        return dict(row)

@app.get("/api/bookings")
async def get_bookings(ids: str | None = None):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        if ids is not None:
            id_list = []
            for item in ids.split(","):
                item = item.strip()
                if item.isdigit():
                    id_list.append(int(item))
            if not id_list:
                return []
            placeholders = ",".join("?" for _ in id_list)
            cursor.execute(
                f"SELECT * FROM bookings WHERE id IN ({placeholders}) ORDER BY date ASC, time ASC",
                id_list
            )
        else:
            cursor.execute("SELECT * FROM bookings ORDER BY date ASC, time ASC")
        rows = cursor.fetchall()
        
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        upcoming = []
        for row in rows:
            booking_dt = f"{row['date']} {row['time']}"
            if booking_dt >= now_str:
                upcoming.append(dict(row))
        return upcoming

@app.delete("/api/bookings/{id}")
async def delete_booking(id: int):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Booking not found")
        cursor.execute("DELETE FROM bookings WHERE id = ?", (id,))
        conn.commit()
        return {"message": "Booking cancelled successfully"}


def get_fallback_image(data: dict) -> str:
    fallback_images = {
        "soup": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
        "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
        "chicken": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
        "pasta": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        "dessert": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
        "breakfast": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
        "baking": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    }
    default_image = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
    
    text_parts = []
    text_parts.append(data.get("title") or "")
    text_parts.append(data.get("recipe_title") or "")
    
    ing_list = data.get("ingredientsList")
    if isinstance(ing_list, list):
        for item in ing_list:
            if isinstance(item, str):
                text_parts.append(item)
                
    raw_ings = data.get("ingredients")
    if isinstance(raw_ings, list):
        for item in raw_ings:
            if isinstance(item, dict):
                name = item.get("name")
                if isinstance(name, str):
                    text_parts.append(name)
            elif isinstance(item, str):
                text_parts.append(item)
                
    search_text = " ".join(text_parts).lower()
    for keyword, url in fallback_images.items():
        if keyword in search_text:
            return url
            
    return default_image


class RecipeRequest(BaseModel):
    ingredients: str
    dietary_preferences: list[str] = []
    meal_type: str = ""
    cooking_style: str = ""
    equipment: list[str] = []
    time_limit: str = ""


@app.post("/api/recipe")
async def generate_recipe(request: RecipeRequest):
    ingredients = request.ingredients.strip()
    if len(ingredients) < 2:
        raise HTTPException(status_code=400, detail="Please tell me what's in your fridge, dear!")
        
    client = _create_client()
    
    # 1. Build user prompt with filters
    user_prompt = f"Here is what I have in my fridge: {ingredients}"
    if request.meal_type:
        user_prompt += f"\nI'd like this to be for: {request.meal_type}"
    if request.dietary_preferences:
        user_prompt += f"\nPlease make sure the recipe is suitable for: {', '.join(request.dietary_preferences)}"
    if request.cooking_style:
        user_prompt += f"\nRequested cooking style: {request.cooking_style}"
    if request.equipment:
        user_prompt += f"\nAvailable kitchen equipment: {', '.join(request.equipment)}"
    if request.time_limit:
        user_prompt += f"\nTime limit: {request.time_limit}"
        
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                {"role": "user", "parts": [{"text": SYSTEM_PROMPT_TEXT + "\n\n" + user_prompt}]}
            ],
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json",
            )
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
        data = json.loads(response_text)
        
        # Normalize and map fields
        input_status = data.get("input_status", "pure_food")
        data["input_status"] = input_status

        if input_status in ["pure_food", "mixed"]:
            if "recipe_title" in data:
                data["title"] = data["recipe_title"]
            if "steps" in data:
                data["instructions"] = data["steps"]

            servings = data.get("servings_default", 2)
            
            # Reconstruct ingredientsList if it's missing but rich ingredients are present
            if "ingredients" in data and "ingredientsList" not in data:
                ing_list = []
                for ing in data["ingredients"]:
                    qty = ing.get("quantity_per_serving", 0.0) * servings
                    if qty == int(qty):
                        qty_str = str(int(qty))
                    else:
                        qty_str = f"{qty:.1f}".rstrip('0').rstrip('.')
                    
                    unit = ing.get("unit", "").strip()
                    name = ing.get("name", "").strip()
                    
                    if unit:
                        ing_list.append(f"{qty_str} {unit} {name}")
                    else:
                        ing_list.append(f"{qty_str} {name}")
                data["ingredientsList"] = ing_list

            if "title" not in data or "ingredientsList" not in data or "instructions" not in data:
                raise ValueError("Missing required fields")
                
    except Exception as e:
        print(f"Text generation error: {e}")
        raise HTTPException(status_code=502, detail="Oh dear, my recipe book is stuck. Try again?")
        
    # 2. Generate Image (Sequential, only for pure_food and mixed)
    image_url = ""
    if data.get("input_status") in ["pure_food", "mixed"]:
        try:
            image_response = client.models.generate_images(
                model=IMAGE_MODEL,
                prompt=f"{SYSTEM_PROMPT_IMAGE}\nDish to photograph: {data.get('title', '')}",
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    output_mime_type="image/jpeg",
                )
            )
            if image_response.generated_images:
                img_bytes = image_response.generated_images[0].image.image_bytes
                b64_img = base64.b64encode(img_bytes).decode('utf-8')
                image_url = f"data:image/jpeg;base64,{b64_img}"
            else:
                image_url = get_fallback_image(data)
        except Exception as e:
            print(f"Image generation error: {e}")
            image_url = get_fallback_image(data)
            
    data["imageUrl"] = image_url
    
    return data

@app.get("/api/health")
async def health():
    return {"status": "cooking"}

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
