# AI-Assisted Development Prompts

## Code Quality & Refactoring

### Security Audit
```
Review this authentication/authorization code for security vulnerabilities. 
Focus on:
- JWT token handling and expiration
- Password hashing and comparison
- Session management
- SQL injection risks
- XSS vulnerabilities
- CSRF protection

[paste code]
```

### Performance Optimization
```
Analyze this database query for performance issues. Suggest:
- Missing indexes
- N+1 query problems
- Inefficient joins
- Pagination strategies
- Caching opportunities

[paste Prisma query or raw SQL]
```

### Type Safety Improvements
```
Review this TypeScript code and suggest improvements for:
- Stricter type definitions
- Removing 'any' types
- Better error handling with discriminated unions
- Zod schema validation alignment with Prisma types

[paste code]
```

## Testing

### Test Coverage Analysis
```
Generate comprehensive test cases for this service function including:
- Happy path scenarios
- Edge cases (null, undefined, empty values)
- Error conditions
- Authorization checks
- Database constraint violations
- Concurrent operations

[paste service function]
```

### Integration Test Design
```
Design integration tests for this API endpoint covering:
- Valid requests with different roles (PROVIDER, FRONT_DESK)
- Invalid authentication/authorization
- Malformed request bodies
- Database state verification
- Audit log creation

[paste API route handler]
```

## Architecture & Design

### Domain Modeling
```
I'm implementing [feature name] in a healthcare application. 
Help me design:
- Database schema with proper relationships
- Prisma models with constraints
- Service layer structure
- API endpoints
- State machine transitions (if applicable)

Requirements:
[list business requirements]
```

### Error Handling Strategy
```
Design a comprehensive error handling strategy for [feature] that includes:
- Custom error classes for different failure modes
- Appropriate HTTP status codes
- User-friendly error messages (no sensitive data leaks)
- Structured error responses
- Logging strategy for debugging

Current implementation: [paste code]
```

### State Machine Design
```
Help me design a state machine for [entity] with these states:
[list states]

Rules:
- What transitions are valid?
- What validations needed per transition?
- Who can perform each transition?
- What side effects occur (notifications, audit logs)?

[paste current implementation if any]
```

## Database & Prisma

### Schema Review
```
Review this Prisma schema for:
- Missing indexes on frequently queried fields
- Cascade delete correctness
- Relationship integrity
- Missing unique constraints
- Audit trail completeness

[paste schema.prisma]
```

### Migration Safety
```
I need to modify this database schema:
[describe changes]

Current schema: [paste relevant models]

Help me:
1. Write a safe migration (no data loss)
2. Handle backward compatibility if needed
3. Update application code to match
4. Plan rollback strategy
```

### Query Optimization
```
This query is slow in production:
[paste Prisma query and execution time]

Database size: [approximate record counts]

Suggest:
- Index additions
- Query restructuring
- Pagination strategy
- Caching approach
```

## API Design

### RESTful Endpoint Design
```
Design a REST API for [feature] following best practices:
- Resource naming
- HTTP methods
- Request/response schemas
- Status codes
- Pagination
- Filtering/sorting
- Authentication/authorization
- Rate limiting

Requirements: [list requirements]
```

### Input Validation
```
Create comprehensive Zod validation schema for this API endpoint:
- Required vs optional fields
- String length limits (especially for database columns)
- Date/time validation
- Email/phone format validation
- Business rule validation
- Custom error messages

Endpoint: [describe endpoint]
Database constraints: [paste Prisma model]
```

## Security & Compliance

### HIPAA Compliance Check
```
Review this feature for HIPAA compliance concerns:
- PHI data handling
- Access logging (who accessed what, when)
- Audit trail completeness
- Data encryption at rest/transit
- User authorization checks
- Session timeout
- Data retention policies

[paste relevant code]
```

### Authorization Logic Review
```
Verify this authorization logic is correct:
- Are all endpoints protected?
- Is role-based access control properly implemented?
- Can users access only their own data?
- Are there any privilege escalation risks?
- Is authorization checked before database queries?

[paste middleware and route handlers]
```

## Code Review Checklist

### Pre-Commit Review
```
Review this code change before commit:

- Type safety: No 'any' types, proper error handling
- Security: No sensitive data logged, proper authorization
- Performance: Efficient queries, proper indexes
- Testing: Adequate test coverage
- Documentation: Updated comments and docs
- Error handling: Graceful failures, user-friendly messages
- Audit logging: Important actions logged
- Consistency: Follows project patterns and conventions

Code:
[paste git diff or changed files]
```

## Debugging

### Production Issue Analysis
```
Production issue details:
- Error: [error message]
- Frequency: [how often]
- User role: [affected role]
- Recent changes: [recent deployments]
- Logs: [paste relevant logs]

Help me:
1. Identify root cause
2. Suggest immediate mitigation
3. Design permanent fix
4. Prevent similar issues
```

### Performance Debugging
```
This operation is slower than expected:
- Operation: [describe]
- Expected time: X ms
- Actual time: Y ms
- Data size: [record counts]
- Database: PostgreSQL/Supabase

Logs/traces: [paste]

Help diagnose and fix.
```

## Documentation

### API Documentation Generation
```
Generate OpenAPI/Swagger documentation for this endpoint:
- Endpoint path and method
- Request body schema
- Response schemas (success + errors)
- Authentication requirements
- Rate limits
- Example requests/responses

[paste route handler code]
```

### Architecture Decision Record
```
Help me write an ADR (Architecture Decision Record) for:
Decision: [decision made]
Context: [why this decision was needed]
Options considered: [alternatives]
Consequences: [tradeoffs]

Format as markdown following ADR template.
```


## Workflows

### Adding a New Feature
1. Use domain modeling prompt to design architecture
2. Request database schema and validation logic
3. Generate service layer with error handling
4. Create API endpoints with proper authorization
5. Request comprehensive test cases
6. Generate API documentation
7. Ask for security review
8. Create ADR for significant decisions

### Debugging Production Issue
1. Use issue analysis prompt with logs/errors
2. Request root cause analysis
3. Get immediate mitigation suggestions
4. Design permanent fix with tests
5. Document lessons learned

### Code Review Process
1. Run pre-commit review prompt
2. Check specific concerns (security, performance)
3. Request test coverage analysis
4. Verify documentation updates
5. Get suggestions for improvements
