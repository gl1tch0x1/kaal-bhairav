FROM golang:1.23-alpine
WORKDIR /app
COPY go.mod ./
# Note: we are not downloading deps yet as go.mod might not have any
COPY . .
# Initialize if go.mod is empty or broken
RUN go mod init asset-service || true
RUN go mod tidy
RUN go build -o main .
EXPOSE 50051
CMD ["./main"]
