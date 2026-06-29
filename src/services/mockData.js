/**
 * Pre-configured mock data for high-fidelity simulation and offline demos
 */

export const DEMO_WEBSITES = [
  {
    id: 'zorastore-checkout',
    name: 'ZoraStore Checkout Page (Checkout & API Bug)',
    url: 'https://zorastore.com/checkout',
    screenshot: '/checkout_bug_screenshot.png',
    consoleLogs: [
      { type: 'info', text: 'Initializing payment gateway client (v4.2.1)...', location: { url: 'https://zorastore.com/checkout.js', line: 42 } },
      { type: 'warning', text: '[Deprecation] Synchronous XMLHttpRequest on the main thread is deprecated.', location: { url: 'https://zorastore.com/vendor.js', line: 1102 } },
      { type: 'error', text: 'TypeError: Cannot read properties of undefined (reading \'applyDiscount\') at checkout.js:210', location: { url: 'https://zorastore.com/checkout.js', line: 210 } }
    ],
    networkRequests: [
      {
        url: 'https://api.zorastore.com/v1/checkout/apply-coupon',
        method: 'POST',
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-98fa21' }
      }
    ],
    preAnalyzedBugs: [
      {
        title: 'Coupon Application Failure (500 Server Error)',
        description: 'Applying the coupon code triggers a 500 Internal Server Error response from the `/apply-coupon` API. This results in an unhandled Javascript TypeError exception in the frontend code since it tries to access properties of an undefined discount structure, breaking the page state.',
        severity: 'Critical',
        type: 'Network',
        stepsToReproduce: [
          'Navigate to ZoraStore Checkout page.',
          'Add items to cart and scroll down to the "Apply Discount Code" field.',
          'Enter the code "INVALID-2026" and click the "Apply" button.',
          'Observe the red error banner displaying a 500 error.'
        ],
        remediation: '1. Update `/server/routes/coupons.js` to handle invalid coupon checks gracefully and return a 400 Bad Request with a message, rather than crashing with a 500.\n2. In the React frontend checkout code, add a safe-access check before calling `.applyDiscount` (e.g. `couponResponse?.data?.applyDiscount`).',
        visualMarkers: [
          { x: 35.2, y: 86.8, width: 49, height: 5.4, label: '500 Server Error Toast' }
        ]
      },
      {
        title: 'Place Order Button Text Overlap & Clipping',
        description: 'The "PLACE ORDER" checkout button at the bottom of the Billing Details card is cut off on its lower edge. This is a layout misalignment indicating that the container height is fixed or the padding values are clipping elements, reducing accessibility.',
        severity: 'Medium',
        type: 'Visual',
        stepsToReproduce: [
          'Open checkout page.',
          'Scroll to the bottom of the Billing Details form.',
          'Inspect the "PLACE ORDER" button area.'
        ],
        remediation: 'Modify CSS layout parameters in `checkout.css`. Remove fixed height rules on `.billing-details-form` and change it to `height: auto` or adjust margins to allow flexible content expansion.',
        visualMarkers: [
          { x: 35.2, y: 92.5, width: 49, height: 2.2, label: 'Clipping Overflow' }
        ]
      }
    ]
  },
  {
    id: 'datastream-dashboard',
    name: 'Datastream Analytics Dashboard (Auth & Visual Bug)',
    url: 'https://ldatastream.analytics/dashboard',
    screenshot: '/dashboard_bug_screenshot.png',
    consoleLogs: [
      { type: 'info', text: 'Dashboard workspace initialized in 420ms.', location: { url: 'https://ldatastream.analytics/dashboard.js', line: 12 } },
      { type: 'error', text: 'Failed to load resource: the server responded with a status of 403 (Forbidden) - session-data.json', location: { url: 'https://ldatastream.analytics/api/v1/session-data', line: 1 } },
      { type: 'error', text: 'Uncaught (in promise) Error: Access denied for analytics data at dashboard.js:84', location: { url: 'https://ldatastream.analytics/dashboard.js', line: 84 } }
    ],
    networkRequests: [
      {
        url: 'https://ldatastream.analytics/api/v1/session-data',
        method: 'GET',
        status: 403,
        statusText: 'Forbidden',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer expired...' }
      }
    ],
    preAnalyzedBugs: [
      {
        title: 'Historical Session API Request Blocked (403 Forbidden)',
        description: 'The dashboard triggers a request to fetch session frequency details which returns a 403 Forbidden. This is caused by an expired or invalid JSON Web Token (JWT) sent in the request header, resulting in an unhandled promise rejection.',
        severity: 'High',
        type: 'Network',
        stepsToReproduce: [
          'Access Datastream dashboard as standard user.',
          'Verify requests being sent under network tab.',
          'Inspect warning banner at the top of the interface.'
        ],
        remediation: 'Implement an automatic token refresh interceptor in the API client (Axios/Fetch wrapper) to obtain a fresh token when a 403 status is detected or before sending API requests.',
        visualMarkers: [
          { x: 59.2, y: 22.1, width: 66.8, height: 6.2, label: '403 Forbidden error notification banner' }
        ]
      },
      {
        title: 'Broken Chart Plot Rendering',
        description: 'The "Session Frequency (7 Days)" graph renders overlapping paths and jagged graphics instead of clean bars, and displays a red error warning circle at its center. This is caused by plotting raw undefined parameters inside the charting library when API payload is missing or forbidden.',
        severity: 'High',
        type: 'Visual',
        stepsToReproduce: [
          'Open the main workspace.',
          'Locate the Session Frequency card chart.',
          'Observe visual graphic overlaps and loader warning symbol.'
        ],
        remediation: 'Ensure the charting module includes a fallback. Wrap the canvas chart component in a conditional block: if `sessionData` is null or load fails, display an empty state graphic rather than drawing incomplete coordinate systems.',
        visualMarkers: [
          { x: 60, y: 49, width: 33, height: 23, label: 'Corrupted chart rendering' }
        ]
      }
    ]
  }
];

export const MOCK_SWAGGER_SPECS = [
  {
    id: 'petstore-spec',
    name: 'Petstore API Specification (Rate limit & security flaws)',
    title: 'Swagger Petstore',
    version: '1.0.6',
    description: 'A sample OpenAPI spec demonstrating API rate limiting vulnerabilities and auth loopholes.',
    endpointsCount: 4,
    rawSpec: {
      openapi: '3.0.2',
      info: {
        title: 'Swagger Petstore',
        description: 'This specification contains typical architectural issues.',
        version: '1.0.6'
      },
      servers: [
        { url: 'https://petstore.swagger.io/v2' }
      ],
      paths: {
        '/pet': {
          put: {
            summary: 'Update an existing pet',
            responses: {
              '200': { description: 'Successful operation' }
            }
          },
          post: {
            summary: 'Add a new pet to the store',
            responses: {
              '200': { description: 'Successful operation' }
            }
          }
        },
        '/pet/{petId}': {
          get: {
            summary: 'Find pet by ID',
            description: 'Returns a single pet without authorization headers check.',
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'integer', format: 'int64' } }
            ],
            responses: {
              '200': { description: 'Successful operation' },
              '400': { description: 'Invalid ID supplied' },
              '404': { description: 'Pet not found' }
            }
          },
          delete: {
            summary: 'Deletes a pet',
            responses: {
              '400': { description: 'Invalid pet value' }
            }
          }
        }
      }
    },
    preAnalyzedBugs: [
      {
        title: 'Missing Global Authorization Scheme',
        description: 'The OpenAPI specification has no `security` schemes defined. Important data mutation endpoints like `POST /pet` and `DELETE /pet/{petId}` do not enforce auth (API Keys, Bearer JWT, OAuth2), making the backend API vulnerable to unauthorized access and bot attacks.',
        severity: 'Critical',
        type: 'Security',
        stepsToReproduce: [
          'Inspect the spec root settings.',
          'Verify that there is no "components/securitySchemes" defined.',
          'Observe that mutation paths like DELETE do not reference security rules.'
        ],
        remediation: 'Define a security scheme (e.g. BearerToken) in `components/securitySchemes` and reference it globally or at individual endpoint paths:\n\n```yaml\ncomponents:\n  securitySchemes:\n    ApiKeyAuth:\n      type: apiKey\n      in: header\n      name: X-API-KEY\nsecurity:\n  - ApiKeyAuth: []\n```',
        affectedPaths: ['/pet', '/pet/{petId}']
      },
      {
        title: 'Undefined Response Model Schemas',
        description: 'Endpoint response definitions (e.g., `200` response for `POST /pet`) lack structural schemas. Without response schema constraints, client SDK generators cannot build typed models, and data contracts may shift silently, breaking frontend integrations.',
        severity: 'Medium',
        type: 'API Schema',
        stepsToReproduce: [
          'Open "/pet" POST path responses.',
          'Notice response has description but no "content/application/json/schema" attribute.'
        ],
        remediation: 'Update the responses config to include a schema model reference:\n\n```json\n"responses": {\n  "200": {\n    "description": "Successful operation",\n    "content": {\n      "application/json": {\n        "schema": {\n          "$ref": "#/components/schemas/Pet"\n        }\n      }\n    }\n  }\n}\n```',
        affectedPaths: ['/pet', '/pet/{petId}']
      }
    ]
  }
];
