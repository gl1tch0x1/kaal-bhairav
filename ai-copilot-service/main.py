import os
import sys
import time
from concurrent import futures
import grpc
from grpc_tools import protoc  # type: ignore

# 1. Compile the protobuf dynamically at runtime for the microservice
PROTO_FILE = "../proto/ai_copilot.proto"
if os.path.exists(PROTO_FILE):
    protoc.main((
        '',
        '-I../proto',
        '--python_out=.',
        '--grpc_python_out=.',
        PROTO_FILE,
    ))

# 2. Import generated stubs
import ai_copilot_pb2  # type: ignore
import ai_copilot_pb2_grpc  # type: ignore

# 3. Implement the Servicer
class AICopilotService(ai_copilot_pb2_grpc.AICopilotServiceServicer):
    def AnalyzeThreat(self, request, context):
        print(f"[gRPC] Analyzing threat for query: {request.query}")
        # Stub logic
        return ai_copilot_pb2.ThreatAnalysisResponse(
            analysis=f"AI analysis for {request.query} reveals standard tracking signatures.",
            confidence=0.88,
            mitre_tactics=["TA0001", "TA0007"]
        )

    def CorrelateData(self, request, context):
        print(f"[gRPC] Correlating data for {len(request.entity_ids)} entities")
        return ai_copilot_pb2.CorrelationResponse(
            correlation_graph_data='{"nodes":[], "links":[]}',
            risk_score=0.92
        )

# 4. Start Server
def serve():
    port = os.environ.get('PORT', '50053')
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_copilot_pb2_grpc.add_AICopilotServiceServicer_to_server(AICopilotService(), server)
    server.add_insecure_port(f'[::]:{port}')
    server.start()
    print(f"AI Copilot Service (gRPC) running on port {port}")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
