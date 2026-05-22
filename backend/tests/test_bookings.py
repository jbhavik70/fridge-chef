import os
import sqlite3
import pytest
from fastapi.testclient import TestClient

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_bookings_temp.db")

@pytest.fixture(autouse=True)
def setup_test_env():
    # Override the DB path to avoid touching the production DB
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

def test_db_initialization():
    # Import app and init_db after setting environment variables
    from main import init_db
    init_db()
    assert os.path.exists(TEST_DB_PATH)

    # Check if bookings table exists
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings';")
    row = cursor.fetchone()
    conn.close()
    assert row is not None
    assert row[0] == "bookings"

def test_create_booking_success():
    from main import app
    client = TestClient(app)
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0199",
        "leftovers": "Stale bread, tomatoes",
        "recipe_title": "Tomato Panzanella",
        "guests": 3,
        "date": "2026-06-01",
        "time": "18:30",
        "notes": "Looking forward to it!"
    }
    response = client.post("/api/bookings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["guests"] == 3
    assert data["date"] == "2026-06-01"
    assert data["time"] == "18:30"
    assert "created_at" in data

def test_create_booking_validation_errors():
    from main import app
    client = TestClient(app)
    # Missing required fields
    response = client.post("/api/bookings", json={})
    assert response.status_code == 422

    # Invalid email format
    response = client.post("/api/bookings", json={
        "name": "Jane", "email": "invalid_email", "leftovers": "stuff", "date": "2026-06-01", "time": "18:30", "guests": 2
    })
    assert response.status_code == 422

    # Invalid date format
    response = client.post("/api/bookings", json={
        "name": "Jane", "email": "jane@example.com", "leftovers": "stuff", "date": "06/01/2026", "time": "18:30", "guests": 2
    })
    assert response.status_code == 422

    # Invalid time format
    response = client.post("/api/bookings", json={
        "name": "Jane", "email": "jane@example.com", "leftovers": "stuff", "date": "2026-06-01", "time": "6:30 PM", "guests": 2
    })
    assert response.status_code == 422

    # Invalid guests number (must be >= 1)
    response = client.post("/api/bookings", json={
        "name": "Jane", "email": "jane@example.com", "leftovers": "stuff", "date": "2026-06-01", "time": "18:30", "guests": 0
    })
    assert response.status_code == 422

def test_get_bookings_upcoming_only():
    from datetime import datetime, timedelta
    from main import app
    client = TestClient(app)

    # Insert multiple test bookings: one in the past, two in the future (unsorted)
    now = datetime.now()
    past_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    future_date1 = (now + timedelta(days=2)).strftime("%Y-%m-%d")
    future_date2 = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    client.post("/api/bookings", json={
        "name": "Past Booking", "email": "past@example.com", "leftovers": "none", "date": past_date, "time": "12:00", "guests": 2
    })
    client.post("/api/bookings", json={
        "name": "Future Booking 2", "email": "future2@example.com", "leftovers": "none", "date": future_date1, "time": "12:00", "guests": 2
    })
    client.post("/api/bookings", json={
        "name": "Future Booking 1", "email": "future1@example.com", "leftovers": "none", "date": future_date2, "time": "12:00", "guests": 2
    })

    # Request GET
    response = client.get("/api/bookings")
    assert response.status_code == 200
    data = response.json()
    
    # Should only return upcoming bookings (2 of them), ordered by date ascending
    assert len(data) == 2
    assert data[0]["name"] == "Future Booking 1"
    assert data[1]["name"] == "Future Booking 2"

def test_delete_booking_success():
    from main import app
    client = TestClient(app)
    # Create booking
    payload = {
        "name": "To Delete",
        "email": "delete@example.com",
        "leftovers": "stuff",
        "date": "2026-06-01",
        "time": "18:30",
        "guests": 2
    }
    resp = client.post("/api/bookings", json=payload)
    assert resp.status_code == 201
    booking_id = resp.json()["id"]

    # Delete booking
    del_resp = client.delete(f"/api/bookings/{booking_id}")
    assert del_resp.status_code == 200
    
    # Verify it's gone
    get_resp = client.get("/api/bookings")
    bookings = get_resp.json()
    assert not any(b["id"] == booking_id for b in bookings)

def test_delete_booking_not_found():
    from main import app
    client = TestClient(app)
    resp = client.delete("/api/bookings/99999")
    assert resp.status_code == 404
    assert "Booking not found" in resp.json()["detail"]
