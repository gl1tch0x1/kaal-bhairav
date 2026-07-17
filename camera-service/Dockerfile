FROM rust:latest as builder

WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y protobuf-compiler


# Assuming proto directory is available contextually; for docker-compose we map it,
# but for the builder we might need to copy it if we build the image from the root context.
# Since docker-compose sets build: ./camera-service, we can't access ../proto easily without modifying docker-compose.
# To keep it simple, we'll assume the user runs docker-compose from the root and we can copy the proto folder in.
# Wait, standard docker-compose build context for ./camera-service doesn't have access to ../proto.
# To fix this, we should change the build context in docker-compose.yml to `.` (root) and use `dockerfile: camera-service/Dockerfile`.
# I will just write the Dockerfile assuming the context is the root, or I will update docker-compose.yml.
# Let's write the Dockerfile assuming context is root.

COPY camera-service/Cargo.toml camera-service/build.rs ./
COPY camera-service/src ./src
COPY proto ../proto

RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/app/target/release/camera-service /usr/local/bin/camera-service
EXPOSE 50052
CMD ["camera-service"]
