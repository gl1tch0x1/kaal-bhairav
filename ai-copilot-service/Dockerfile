FROM python:3.11-slim
WORKDIR /app

# Install dependency requirements first (layer cache)
COPY ai-copilot-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proto definitions for build-time compilation
COPY proto ./proto

# Compile proto stubs at build time
RUN python -m grpc_tools.protoc -Iproto --python_out=. --grpc_python_out=. proto/ai_copilot.proto

# Copy the service source code
COPY ai-copilot-service/main.py .

EXPOSE 50053
CMD ["python", "main.py"]
