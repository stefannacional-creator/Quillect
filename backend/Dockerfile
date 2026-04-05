FROM python:3.11-slim

WORKDIR /app

# Install dependencies directly
RUN pip install --no-cache-dir \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.30.0" \
    "langchain-core>=0.3.0" \
    "langchain-groq>=0.2.0" \
    "langchain-xai>=0.2.0" \
    "python-dotenv>=1.0.0" \
    "pydantic>=2.0.0"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
