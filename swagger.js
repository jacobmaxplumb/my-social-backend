const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Backend API',
      version: '1.0.0',
      description: 'Express API with JWT authentication for social feed and friends',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/register or /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code in snake_case',
                  example: 'validation_error',
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'Validation failed',
                },
                details: {
                  type: 'object',
                  description: 'Optional additional error details',
                },
              },
              required: ['code', 'message'],
            },
          },
          required: ['error'],
        },
        Friend: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'f1',
            },
            username: {
              type: 'string',
              example: 'alex_johnson',
            },
            profileImage: {
              type: 'string',
              description: 'Emoji or URL',
              example: '👨',
            },
            status: {
              type: 'string',
              enum: ['online', 'offline'],
              example: 'online',
            },
            mutualFriends: {
              type: 'number',
              example: 5,
            },
          },
          required: ['id', 'username', 'profileImage'],
        },
        FriendSuggestion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 's1',
            },
            username: {
              type: 'string',
              example: 'lisa_anderson',
            },
            profileImage: {
              type: 'string',
              description: 'Emoji or URL',
              example: '👩',
            },
            mutualFriends: {
              type: 'number',
              example: 4,
            },
          },
          required: ['id', 'username', 'profileImage', 'mutualFriends'],
        },
        PendingRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'r1',
            },
            username: {
              type: 'string',
              example: 'chris_miller',
            },
            profileImage: {
              type: 'string',
              description: 'Emoji or URL',
              example: '👨',
            },
            mutualFriends: {
              type: 'number',
              example: 3,
            },
            type: {
              type: 'string',
              enum: ['incoming', 'outgoing'],
              example: 'incoming',
            },
            sentAt: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp',
              example: '2024-01-15T10:00:00.000Z',
            },
            relativeTimestamp: {
              type: 'string',
              description: 'Human-readable relative time',
              example: '2h ago',
            },
          },
          required: ['id', 'username', 'profileImage', 'type', 'sentAt'],
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'c1',
            },
            username: {
              type: 'string',
              example: 'sarah_chen',
            },
            profileImage: {
              type: 'string',
              description: 'Emoji or URL',
              example: '👩',
            },
            text: {
              type: 'string',
              example: 'Nice work!',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp',
              example: '2024-01-15T11:30:00.000Z',
            },
            relativeTimestamp: {
              type: 'string',
              description: 'Human-readable relative time',
              example: '30m ago',
            },
            likes: {
              type: 'number',
              example: 2,
            },
          },
          required: ['id', 'username', 'profileImage', 'text', 'timestamp'],
        },
        Post: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'p1',
            },
            username: {
              type: 'string',
              example: 'alex_johnson',
            },
            profileImage: {
              type: 'string',
              description: 'Emoji or URL',
              example: '👨',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp',
              example: '2024-01-15T11:00:00.000Z',
            },
            relativeTimestamp: {
              type: 'string',
              description: 'Human-readable relative time',
              example: '1h ago',
            },
            text: {
              type: 'string',
              example: 'Just finished a great workout! 💪',
            },
            likes: {
              type: 'number',
              example: 12,
            },
            comments: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Comment',
              },
            },
          },
          required: ['id', 'username', 'profileImage', 'timestamp', 'text'],
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              example: 10,
            },
            limit: {
              type: 'number',
              example: 20,
            },
            offset: {
              type: 'number',
              example: 0,
            },
          },
          required: ['total', 'limit', 'offset'],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'unauthorized',
                  message: 'Missing or invalid authorization header',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

