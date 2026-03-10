from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

# Initialize LLM once
llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.2)

# Prompt template for classification
prompt = PromptTemplate(
    input_variables=["message"],
    template="""
    Classify the emergency message into one category:

    fire
    medical
    accident
    crime
    other

    Message: {message}
    """
)

def classify_emergency_node(message: str) -> str:
    """
    LangGraph-compatible node to classify emergency type.

    Input: emergency message string
    Output: emergency type string ("fire", "medical", "accident", "crime", "other")
    """
    chain = prompt | llm
    result = chain.invoke({"message": message})
    return result.content.strip()