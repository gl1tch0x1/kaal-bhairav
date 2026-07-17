use warp::Filter;
use serde::Serialize;

#[derive(Serialize)]
struct StatusResponse {
    status: String,
    message: String,
}

#[tokio::main]
async fn main() {
    let health_route = warp::path!("health")
        .map(|| {
            let response = StatusResponse {
                status: "ok".to_string(),
                message: "Rust endpoint agent stub running".to_string(),
            };
            warp::reply::json(&response)
        });

    println!("Rust service running on http://127.0.0.1:8080");
    warp::serve(health_route)
        .run(([127, 0, 0, 1], 8080))
        .await;
}
