import os
import pytest
import httpx

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost")

@pytest.fixture(scope="session")
def gateway_url():
    return GATEWAY_URL

@pytest.fixture(scope="session")
def client():
    with httpx.Client(base_url=GATEWAY_URL, timeout=10.0, trust_env=False) as c:
        yield c
