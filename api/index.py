import sys
import os
from pathlib import Path

# Add backend directory to sys.path so that 'app.*' imports resolve cleanly
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Ensure writable uploads directory in serverless environment
if os.environ.get("VERCEL"):
    os.environ.setdefault("UPLOAD_DIR", "/tmp/uploads")

from app.main import app
