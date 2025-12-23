# Advanced Task Features API Documentation

Complete REST API documentation for task dependencies, subtasks, recurring tasks, and templates.

## Base URL
```
https://your-domain.com/api/tasks
```

## Authentication
All endpoints require authentication. Include the user's authentication token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Task Dependencies API

**Endpoint**: `/api/tasks/dependencies`

### Create Dependency
Creates a new dependency relationship between tasks with circular dependency validation.

**Method**: `POST`

**Request Body**:
```json
{
  "dependentTaskId": "task-123",
  "blockingTaskId": "task-456",
  "projectId": "project-789"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "dependency": {
    "id": "dep-001",
    "dependentTaskId": "task-123",
    "blockingTaskId": "task-456",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Response** (400 - Circular Dependency):
```json
{
  "error": "This dependency would create a circular reference",
  "circularDependencies": [
    ["task-123", "task-456", "task-789", "task-123"]
  ]
}
```

### Get Dependencies
Get blocking tasks, dependent tasks, or full status for a task.

**Method**: `GET`

**Query Parameters**:
- `taskId` (required): ID of the task
- `type` (optional): `blocking`, `dependent`, or `status`
- `projectId` (required for `status` type)

**Examples**:

Get blocking tasks:
```
GET /api/tasks/dependencies?taskId=task-123&type=blocking
```

**Response**:
```json
{
  "dependencies": [
    {
      "id": "dep-001",
      "dependentTaskId": "task-123",
      "blockingTaskId": "task-456",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

Get full status:
```
GET /api/tasks/dependencies?taskId=task-123&type=status&projectId=project-789
```

**Response**:
```json
{
  "status": {
    "isBlocked": true,
    "canStart": false,
    "blockingTasks": [
      {
        "id": "task-456",
        "name": "Setup Database",
        "completed": false
      }
    ],
    "dependentTasks": [
      {
        "id": "task-789",
        "name": "Deploy to Production",
        "completed": false
      }
    ]
  }
}
```

### Delete Dependency
Remove a dependency relationship.

**Method**: `DELETE`

**Query Parameters**:
- `dependentTaskId` (required)
- `blockingTaskId` (required)

**Example**:
```
DELETE /api/tasks/dependencies?dependentTaskId=task-123&blockingTaskId=task-456
```

**Response** (200):
```json
{
  "success": true,
  "message": "Dependency removed"
}
```

---

## 2. Subtasks API

**Endpoint**: `/api/tasks/subtasks`

### Add Subtask
Add a single subtask or bulk create multiple subtasks.

**Method**: `POST`

**Single Subtask**:
```json
{
  "task": { /* task object */ },
  "subtaskName": "Write unit tests",
  "estimatedHours": 2,
  "assignees": ["user-123"]
}
```

**Bulk Create**:
```json
{
  "task": { /* task object */ },
  "subtaskName": [
    "Design API",
    "Implement endpoints",
    "Write tests",
    "Documentation"
  ],
  "bulk": true,
  "estimatedHours": 4
}
```

**Response** (201):
```json
{
  "success": true,
  "task": { /* updated task with subtasks */ },
  "count": 4
}
```

### Update Subtask
Update subtask properties or perform actions.

**Method**: `PUT`

**Toggle Completion**:
```json
{
  "task": { /* task object */ },
  "subtaskId": "sub-123",
  "action": "toggle"
}
```

**Move Subtask**:
```json
{
  "task": { /* task object */ },
  "subtaskId": "sub-123",
  "action": "moveUp"  // or "moveDown"
}
```

**Update Properties**:
```json
{
  "task": { /* task object */ },
  "subtaskId": "sub-123",
  "updates": {
    "name": "Updated name",
    "estimatedHours": 3
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "task": { /* updated task */ }
}
```

### Delete Subtask
Remove a subtask from a task.

**Method**: `DELETE`

**Request Body**:
```json
{
  "task": { /* task object */ },
  "subtaskId": "sub-123"
}
```

**Response** (200):
```json
{
  "success": true,
  "task": { /* updated task */ }
}
```

### Get Statistics
Get progress and statistics for subtasks.

**Method**: `GET`

**Query Parameters**:
- `taskJson`: URL-encoded JSON string of task object

**Example**:
```
GET /api/tasks/subtasks?taskJson=%7B...%7D
```

**Response** (200):
```json
{
  "progress": {
    "total": 5,
    "completed": 3,
    "percentage": 60,
    "remaining": 2
  },
  "stats": {
    "progress": { /* same as above */ },
    "totalHours": 20,
    "remainingHours": 8,
    "assigneeCount": 3,
    "averageProgress": 60
  }
}
```

---

## 3. Recurring Tasks API

**Endpoint**: `/api/tasks/recurring`

### Generate Instance
Generate the next task instance from a recurring task template.

**Method**: `POST`

**Request Body**:
```json
{
  "task": { /* recurring task template */ },
  "scheduledDate": "2025-02-01T00:00:00.000Z",  // optional
  "occurrenceNumber": 3  // optional, auto-calculated if omitted
}
```

**Response** (201):
```json
{
  "success": true,
  "generatedTask": {
    "id": "task-recurring-3-1234567890",
    "name": "Weekly Review",
    "dueDate": "2025-02-01T00:00:00.000Z",
    "originalTaskId": "task-template-123",
    "occurrenceNumber": 3,
    "isRecurring": false
  },
  "instance": {
    "id": "instance-001",
    "originalTaskId": "task-template-123",
    "generatedTaskId": "task-recurring-3-1234567890",
    "occurrenceNumber": 3,
    "scheduledDate": "2025-02-01T00:00:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "nextScheduledDate": "2025-02-08T00:00:00.000Z"
}
```

### Get Instances
Get all generated instances for a recurring task.

**Method**: `GET`

**Query Parameters**:
- `taskId`: Template task ID
- `action`: `instances`

**Example**:
```
GET /api/tasks/recurring?taskId=task-123&action=instances
```

**Response** (200):
```json
{
  "instances": [
    {
      "id": "instance-001",
      "originalTaskId": "task-123",
      "generatedTaskId": "task-gen-001",
      "occurrenceNumber": 1,
      "scheduledDate": "2025-01-15T00:00:00.000Z",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Preview Upcoming Occurrences
Preview future dates based on a recurrence pattern.

**Method**: `GET`

**Query Parameters**:
- `action`: `preview`
- `pattern`: URL-encoded JSON recurrence pattern
- `fromDate`: Start date (ISO string)
- `lookAheadDays`: Number of days to look ahead (default 30)

**Example Pattern**:
```json
{
  "frequency": "weekly",
  "interval": 1,
  "daysOfWeek": [1, 3, 5],  // Mon, Wed, Fri
  "endDate": "2025-12-31T00:00:00.000Z"
}
```

**Response** (200):
```json
{
  "upcoming": [
    "2025-01-15T00:00:00.000Z",
    "2025-01-17T00:00:00.000Z",
    "2025-01-20T00:00:00.000Z",
    "2025-01-22T00:00:00.000Z",
    "2025-01-24T00:00:00.000Z"
  ]
}
```

### Calculate Next Occurrence
Calculate the next occurrence date.

**Method**: `GET`

**Query Parameters**:
- `action`: `next`
- `pattern`: URL-encoded JSON recurrence pattern
- `fromDate`: Base date (optional)

**Response** (200):
```json
{
  "nextOccurrence": {
    "date": "2025-02-01T00:00:00.000Z",
    "occurrenceNumber": 1,
    "isLastOccurrence": false
  }
}
```

### Get Pattern Description
Get human-readable description of a recurrence pattern.

**Method**: `GET`

**Query Parameters**:
- `action`: `description`
- `pattern`: URL-encoded JSON recurrence pattern

**Response** (200):
```json
{
  "description": "Weekly on Monday, Wednesday, Friday until Dec 31, 2025"
}
```

### Update Pattern
Update a task's recurrence pattern.

**Method**: `PUT`

**Request Body**:
```json
{
  "task": { /* task object */ },
  "pattern": {
    "frequency": "monthly",
    "interval": 1,
    "dayOfMonth": 15,
    "maxOccurrences": 12
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "task": { /* updated task with new pattern */ }
}
```

### Delete All Instances
Delete all generated instances for a recurring task.

**Method**: `DELETE`

**Query Parameters**:
- `taskId`: Template task ID

**Response** (200):
```json
{
  "success": true,
  "message": "All instances deleted"
}
```

---

## 4. Task Templates API

**Endpoint**: `/api/tasks/templates`

### Save Task as Template
Create a template from an existing task.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "saveAsTemplate",
  "task": { /* task object */ },
  "userId": "user-123",
  "category": "Development"
}
```

**Response** (201):
```json
{
  "success": true,
  "template": {
    "id": "template-001",
    "userId": "user-123",
    "name": "API Development",
    "description": "Standard API development task",
    "category": "Development",
    "defaultPriority": "High",
    "defaultEstimatedHours": 8,
    "subtasks": [ /* array of subtasks */ ],
    "tags": ["api", "backend"],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Create Task from Template
Generate a new task using a template.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "createFromTemplate",
  "template": { /* template object */ },
  "options": {
    "name": "Custom Task Name",
    "dueDate": "2025-02-01T00:00:00.000Z",
    "priority": "Urgent",
    "assignees": ["user-456"]
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "task": { /* newly created task */ }
}
```

### Batch Create from Template
Create multiple tasks from a template.

**Method**: `POST`

**Request Body**:
```json
{
  "action": "batchCreate",
  "template": { /* template object */ },
  "count": 5,
  "namePrefix": "Sprint 1 - ",
  "nameSuffix": "",
  "startDate": "2025-01-15T00:00:00.000Z",
  "daysBetween": 7
}
```

**Response** (201):
```json
{
  "success": true,
  "created": 5,
  "failed": 0,
  "tasks": [ /* array of created tasks */ ]
}
```

### Get Templates
Get all templates for a user with optional filtering.

**Method**: `GET`

**Query Parameters**:
- `userId` (required)
- `action`: `all` (default), `search`, `categories`, `mostUsed`, `stats`
- `query`: Search query (for search action)
- `category`: Filter by category
- `sortBy`: Sort field (`name`, `category`, `createdAt`, `updatedAt`)
- `sortOrder`: `asc` or `desc`

**Examples**:

Get all templates:
```
GET /api/tasks/templates?userId=user-123
```

Search templates:
```
GET /api/tasks/templates?userId=user-123&action=search&query=api
```

Get categories:
```
GET /api/tasks/templates?userId=user-123&action=categories
```

**Response** (200):
```json
{
  "templates": [ /* array of templates */ ]
}
```

or for categories:
```json
{
  "categories": ["Development", "Design", "Testing", "Documentation"]
}
```

### Update Template
Update an existing template.

**Method**: `PUT`

**Request Body**:
```json
{
  "template": { /* template object */ },
  "updates": {
    "name": "Updated Template Name",
    "category": "New Category",
    "defaultEstimatedHours": 10
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "template": { /* updated template */ }
}
```

### Delete Template
Delete a template.

**Method**: `DELETE`

**Query Parameters**:
- `templateId` (required)

**Response** (200):
```json
{
  "success": true,
  "message": "Template deleted"
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request**:
```json
{
  "error": "Missing required field: taskId"
}
```

**404 Not Found**:
```json
{
  "error": "Task not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

API endpoints are rate limited to:
- 100 requests per minute for GET requests
- 50 requests per minute for POST/PUT/DELETE requests

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642257600
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Create a dependency
const response = await fetch('/api/tasks/dependencies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    dependentTaskId: 'task-123',
    blockingTaskId: 'task-456',
    projectId: 'project-789'
  })
});

const data = await response.json();

// Generate recurring task instance
const recurringResponse = await fetch('/api/tasks/recurring', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    task: recurringTask
  })
});
```

### cURL

```bash
# Create dependency
curl -X POST https://your-domain.com/api/tasks/dependencies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dependentTaskId": "task-123",
    "blockingTaskId": "task-456",
    "projectId": "project-789"
  }'

# Get templates
curl -X GET "https://your-domain.com/api/tasks/templates?userId=user-123&action=all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Implementation Notes

### Storage Placeholders
Some endpoints contain placeholder functions that need implementation:
- `getAllTasksForProject()` - Load tasks for dependency validation
- `saveTemplateToStorage()` - Save template to your storage backend
- `getTemplatesFromStorage()` - Load templates from storage
- `deleteTemplateFromStorage()` - Delete template from storage

These should be implemented based on your chosen storage solution (Supabase, PostgreSQL, MongoDB, etc.).

### CORS Configuration
All endpoints include CORS headers for cross-origin requests. Adjust the `Access-Control-Allow-Origin` header based on your deployment needs.

### Authentication
Add authentication middleware to verify user tokens before processing requests. The current implementation assumes authentication is handled at a higher level.

---

## Support

For issues or questions:
1. Check error messages in API responses
2. Verify request body/query parameters match documentation
3. Check browser console for CORS errors
4. Verify authentication token is valid

---

**Complete API implementation for advanced task management!**
