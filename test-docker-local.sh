#!/bin/bash

echo "🔨 Building Docker image..."
docker build -t bookingfast-test \
  --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
  --build-arg VITE_SUPABASE_SERVICE_ROLE_KEY="${VITE_SUPABASE_SERVICE_ROLE_KEY}" \
  --build-arg VITE_STRIPE_PUBLIC_KEY="${VITE_STRIPE_PUBLIC_KEY}" \
  --build-arg VITE_BREVO_API_KEY="${VITE_BREVO_API_KEY}" \
  --build-arg VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID}" \
  --build-arg VITE_GOOGLE_CLIENT_SECRET="${VITE_GOOGLE_CLIENT_SECRET}" \
  .

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Starting container on port 3000..."
docker run -d --name bookingfast-test -p 3000:80 bookingfast-test

if [ $? -ne 0 ]; then
  echo "❌ Container failed to start!"
  exit 1
fi

echo "⏳ Waiting for container to be ready..."
sleep 3

echo "🔍 Testing if app is accessible..."
curl -I http://localhost:3000

echo ""
echo "📊 Container logs:"
docker logs bookingfast-test

echo ""
echo "🎉 Test completed!"
echo "Access the app at: http://localhost:3000"
echo ""
echo "To stop the test:"
echo "  docker stop bookingfast-test"
echo "  docker rm bookingfast-test"
echo "  docker rmi bookingfast-test"
