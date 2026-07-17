FROM golang:1.24-alpine AS builder
WORKDIR /app

# Copy all sources first, then resolve and download deps
COPY . .
RUN go get github.com/redis/go-redis/v9@v9.7.0 && go mod tidy && go build -o main .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 50051
CMD ["./main"]
