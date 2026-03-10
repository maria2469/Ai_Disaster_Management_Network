from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.2)

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
    chain = prompt | llm
    result = chain.invoke({"message": message})
    return result.content.strip()