import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import os

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_bookings_temp_api.db")
os.environ["DB_PATH"] = TEST_DB_PATH
os.environ["GEMINI_API_KEY"] = "fake_key"

from main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_env():
    # Override the DB path to avoid touching the production DB or other tests' DB
    os.environ["DB_PATH"] = TEST_DB_PATH
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass
    # Initialize the database table
    from main import init_db
    init_db()
    yield
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "cooking"}

@patch("main._create_client")
def test_generate_recipe_success(mock_create_client):
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    # Mock text generation
    mock_generate_content = MagicMock()
    mock_generate_content.text = """
    {
        "title": "Grandma's Onion Frittata",
        "ingredientsList": ["2 eggs", "Half an onion"],
        "instructions": ["Chop the onion.", "Beat the eggs and cook."]
    }
    """
    mock_client.models.generate_content.return_value = mock_generate_content
    
    # Mock image generation
    mock_generate_images = MagicMock()
    mock_image = MagicMock()
    mock_image.image.image_bytes = b"fake_image_bytes"
    mock_generate_images.generated_images = [mock_image]
    mock_client.models.generate_images.return_value = mock_generate_images
    
    response = client.post("/api/recipe", json={"ingredients": "eggs, onion"})
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == "Grandma's Onion Frittata"
    assert len(data["ingredientsList"]) == 2
    assert len(data["instructions"]) == 2
    assert data["imageUrl"].startswith("data:image/jpeg;base64,")

@patch("main._create_client")
def test_generate_recipe_missing_fields(mock_create_client):
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    # Mock text generation with invalid json (missing title)
    mock_generate_content = MagicMock()
    mock_generate_content.text = """
    {
        "ingredientsList": ["2 eggs", "Half an onion"],
        "instructions": ["Chop the onion.", "Beat the eggs and cook."]
    }
    """
    mock_client.models.generate_content.return_value = mock_generate_content
    
    response = client.post("/api/recipe", json={"ingredients": "eggs, onion"})
    assert response.status_code == 502
    assert "Try again" in response.json()["detail"]

def test_generate_recipe_empty_input():
    response = client.post("/api/recipe", json={"ingredients": "a"})
    assert response.status_code == 400
    assert "tell me what's in your fridge" in response.json()["detail"]

def test_bookings_flow():
    # Setup a unique/mocked test database
    import tempfile
    import os
    from main import init_db
    
    booking_data = {
        "name": "Alice Green",
        "email": "alice@example.com",
        "phone": "555-0199",
        "leftovers": "spinach, eggs",
        "recipe_title": "Grandma's Frittata",
        "guests": 4,
        "date": "2026-06-15",
        "time": "19:00",
        "notes": "No garlic please"
    }
    # Create booking
    res = client.post("/api/bookings", json=booking_data)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] is not None
    assert data["name"] == "Alice Green"
    assert data["email"] == "alice@example.com"
    assert data["guests"] == 4
    
    # List bookings
    res_list = client.get("/api/bookings")
    assert res_list.status_code == 200
    bookings = res_list.json()
    assert len(bookings) >= 1
    assert any(b["id"] == data["id"] for b in bookings)
    
    # Delete booking
    res_del = client.delete(f"/api/bookings/{data['id']}")
    assert res_del.status_code == 200
    assert res_del.json() == {"message": "Booking cancelled successfully"}

    # Attempt to delete non-existent booking
    res_del_fail = client.delete(f"/api/bookings/{data['id']}")
    assert res_del_fail.status_code == 404


@patch("main._create_client")
def test_generate_recipe_with_filters(mock_create_client):
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    # Mock text generation
    mock_generate_content = MagicMock()
    mock_generate_content.text = """
    {
        "title": "Comfort Oven Veggies",
        "ingredientsList": ["3 potatoes", "1 onion"],
        "instructions": ["Chop the potatoes and onion.", "Bake in the oven."]
    }
    """
    mock_client.models.generate_content.return_value = mock_generate_content
    
    # Mock image generation
    mock_generate_images = MagicMock()
    mock_image = MagicMock()
    mock_image.image.image_bytes = b"fake_image_bytes"
    mock_generate_images.generated_images = [mock_image]
    mock_client.models.generate_images.return_value = mock_generate_images
    
    payload = {
        "ingredients": "potatoes, onion",
        "cooking_style": "Comfort Food",
        "equipment": ["Oven"],
        "time_limit": "Under 30 mins"
    }
    
    response = client.post("/api/recipe", json=payload)
    assert response.status_code == 200
    
    # Assert successful response structure and content
    data = response.json()
    assert data["title"] == "Comfort Oven Veggies"
    assert len(data["ingredientsList"]) == 2
    assert len(data["instructions"]) == 2
    assert data["imageUrl"].startswith("data:image/jpeg;base64,")
    
    # Verify that the mock model is called with the filters appended in the user prompt.
    mock_client.models.generate_content.assert_called_once()
    call_args = mock_client.models.generate_content.call_args
    contents = call_args[1]["contents"]
    user_prompt_text = contents[0]["parts"][0]["text"]
    
    assert "Here is what I have in my fridge: potatoes, onion" in user_prompt_text
    assert "Requested cooking style: Comfort Food" in user_prompt_text
    assert "Available kitchen equipment: Oven" in user_prompt_text
    assert "Time limit: Under 30 mins" in user_prompt_text


@patch("main._create_client")
def test_generate_recipe_unsplash_fallback(mock_create_client):
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    # Mock text generation (Rustic Chicken matches "chicken" keyword)
    mock_generate_content = MagicMock()
    mock_generate_content.text = """
    {
        "title": "Rustic Chicken",
        "ingredientsList": ["chicken", "carrots", "onion"],
        "instructions": ["Boil chicken.", "Add veggies.", "Simmer."]
    }
    """
    mock_client.models.generate_content.return_value = mock_generate_content
    
    # Mock image generation raising an Exception
    mock_client.models.generate_images.side_effect = Exception("Imagen API is down")
    
    response = client.post("/api/recipe", json={"ingredients": "chicken, carrots, onion"})
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == "Rustic Chicken"
    assert isinstance(data["imageUrl"], str)
    assert data["imageUrl"].startswith("https://images.unsplash.com/")
    # "chicken" keyword matches chicken fallback URL containing "photo-1604908176997-125f25cc6f3d"
    assert "photo-1604908176997-125f25cc6f3d" in data["imageUrl"]

