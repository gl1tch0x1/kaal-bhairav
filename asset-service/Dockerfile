FROM golang:1.23-alpine AS builder
WORKDIR /app

# Copy module files first to leverage Docker layer caching for deps
COPY go.mod ./

# Tidy and download dependencies (generates go.sum inside the build layer)
RUN go mod tidy && go mod download

COPY . .
RUN go build -o main .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 50051
CMD ["./main"]
