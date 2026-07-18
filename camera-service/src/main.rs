use tonic::{transport::Server, Request, Response, Status};

pub mod camera {
    tonic::include_proto!("camera");
}

use camera::camera_service_server::{CameraService, CameraServiceServer};
use camera::{CameraRequest, CameraStreamResponse, FootageRequest, FootageAnalysisResponse};

fn check_auth<T>(request: &Request<T>) -> Result<(), Status> {
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_default();
    if jwt_secret.is_empty() {
        return Ok(());
    }
    if let Some(auth_val) = request.metadata().get("authorization") {
        if let Ok(auth_str) = auth_val.to_str() {
            if auth_str == format!("Bearer {}", jwt_secret) {
                return Ok(());
            }
        }
    }
    Err(Status::unauthenticated("Missing or invalid inter-service authentication token"))
}

#[derive(Debug, Default)]
pub struct MyCameraService {}

#[tonic::async_trait]
impl CameraService for MyCameraService {
    async fn get_camera_stream(
        &self,
        request: Request<CameraRequest>,
    ) -> Result<Response<CameraStreamResponse>, Status> {
        check_auth(&request)?;
        let req = request.into_inner();
        println!("Received request for camera stream: {}", req.camera_id);

        let reply = CameraStreamResponse {
            stream_url: format!("rtsp://camera.internal/{}/stream", req.camera_id),
            status: "active".into(),
        };

        Ok(Response::new(reply))
    }

    async fn analyze_footage(
        &self,
        request: Request<FootageRequest>,
    ) -> Result<Response<FootageAnalysisResponse>, Status> {
        check_auth(&request)?;
        let req = request.into_inner();
        println!("Analyzing footage for camera {} at {}", req.camera_id, req.timestamp);

        let reply = FootageAnalysisResponse {
            threat_detected: false,
            description: "No anomalies detected in the designated time frame.".into(),
            confidence: 0.98,
        };

        Ok(Response::new(reply))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "0.0.0.0:50052".parse()?;
    let service = MyCameraService::default();

    println!("Camera gRPC Service listening on {}", addr);

    Server::builder()
        .add_service(CameraServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}
