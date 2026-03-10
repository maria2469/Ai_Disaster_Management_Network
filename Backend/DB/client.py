import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)