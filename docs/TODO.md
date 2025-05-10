## Rules for Cursor

- When the user provides a command, generate a structured TODO list based on the request and edit this .mdc file.
- Each TODO item should be specific, actionable, and categorized based on the development phase.
- Use markdown checkboxes (`- [ ]`) for easy tracking.
- When a task is completed, move it under the `## Done` section.

## TODO

### 1. Project Setup and Understanding
- [ ] Set up Supabase project in dashboard
- [ ] Configure environment variables
- [ ] Test Supabase connection

### 2. Authentication System
- [ ] Implement sign-up functionality
- [ ] Implement sign-in functionality
- [ ] Create protected routes
- [ ] Add user profile management
- [ ] Implement session handling

### 3. Database Design
- [ ] Create database tables in Supabase
- [ ] Set up Row Level Security (RLS) policies
- [ ] Test database operations
- [ ] Implement data validation

### 4. Storage System
- [ ] Set up storage buckets
- [ ] Configure storage policies
- [ ] Implement upload functionality
- [ ] Implement download functionality
- [ ] Implement delete functionality

### 5. Image Management
- [ ] Create image upload component
- [ ] Implement image listing
- [ ] Add image sharing functionality
- [ ] Create image deletion feature
- [ ] Add image preview functionality

### 6. Sharing System
- [ ] Implement share link generation
- [ ] Add expiration date functionality
- [ ] Create access control system
- [ ] Implement permission management

### 7. Security and Best Practices
- [ ] Implement input validation
- [ ] Set up error handling
- [ ] Add rate limiting
- [ ] Implement secure file uploads

### 8. Testing and Optimization
- [ ] Write unit tests
- [ ] Perform integration testing
- [ ] Optimize database queries
- [ ] Implement caching
- [ ] Monitor performance

## DONE

### Project Setup
- [x] Install Supabase dependencies (@supabase/supabase-js and @supabase/ssr)
- [x] Create Supabase client configuration (client.ts and server.ts)
- [x] Set up environment variables structure

### Database Design
- [x] Design database schema for Users table
- [x] Design database schema for Images table
- [x] Create SQL migration file with table definitions
- [x] Define RLS policies for security
- [x] Create database indexes for performance