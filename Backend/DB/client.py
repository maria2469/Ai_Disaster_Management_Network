# db/client.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"]

# Single shared Supabase client instance
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
