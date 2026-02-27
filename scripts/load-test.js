import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 load test — DataShare API
// Run: k6 run scripts/load-test.js
// Install k6: brew install k6

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // montée en charge
    { duration: '20s', target: 10 },  // charge nominale
    { duration: '10s', target: 0 },   // descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.01'],    // taux d'erreur < 1%
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  // Création d'un compte pour les tests
  const res = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email: `perf_${Date.now()}@test.com`, password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return { token: res.json('access_token') };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Test GET /files/my
  const myFiles = http.get(`${BASE_URL}/files/my`, { headers });
  check(myFiles, {
    'GET /files/my status 200': (r) => r.status === 200,
    'GET /files/my < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
