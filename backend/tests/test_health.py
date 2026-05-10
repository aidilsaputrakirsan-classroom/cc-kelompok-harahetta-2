"""
test_health.py — Health check endpoint tests (1 test)
"""

import pytest


def test_health_check(client):
    """GET /health should return status healthy."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Sewain"
    assert "database" in data
    assert "version" in data
