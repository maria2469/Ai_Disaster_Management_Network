# agents/emergency_classifier.py
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.2)

_prompt = PromptTemplate(
    input_variables=["message"],
    template="""
Classify the emergency message into exactly one of these categories:

fire
medical
accident
crime
other

Respond with only the category name, nothing else.

Message: {message}
""",
)

_chain = _prompt | llm


def classify_emergency(message: str) -> str:
    """Returns one of: fire, medical, accident, crime, other."""
    result = _chain.invoke({"message": message})
    return result.content.strip().lower()
