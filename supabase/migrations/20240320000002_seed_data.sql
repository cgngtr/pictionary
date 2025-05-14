-- Seed data for Users table
INSERT INTO users (id, username, first_name, last_name)
VALUES 
  ('d0e10000-0000-4000-a000-000000000001', 'johndoe', 'John', 'Doe'),
  ('d0e10000-0000-4000-a000-000000000002', 'janedoe', 'Jane', 'Doe');

-- Seed data for Profiles table
INSERT INTO profiles (id, user_id, description, avatar_url)
VALUES
  ('d0e10000-0000-4000-b000-000000000001', 'd0e10000-0000-4000-a000-000000000001', 'Hi, I am John! I love drawing and sharing my artwork.', 'https://example.com/avatars/john.jpg'),
  ('d0e10000-0000-4000-b000-000000000002', 'd0e10000-0000-4000-a000-000000000002', 'Hello, I am Jane! Art enthusiast and creator.', 'https://example.com/avatars/jane.jpg');

-- Seed data for auth.users table (assuming it exists with supabase auth)
-- NOTE: This is for demo purposes only. In a real application, users would sign up through Supabase Auth.
-- The plaintext passwords here are just placeholders.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('d0e10000-0000-4000-a000-000000000001', 'john@example.com', '$2a$10$GvGJjT4EBDXObRvWrT8Y9OrFnrGu4W23f4tfE6bqSrMygEYJKgJ4y', NOW(), NOW(), NOW()),
  ('d0e10000-0000-4000-a000-000000000002', 'jane@example.com', '$2a$10$kNkqFGZTlrVQwfmTEOKSz.fWbDEy8lXnXHBBvYkoyi3s1JANj8l6G', NOW(), NOW(), NOW());

-- Seed data for Images table
INSERT INTO images (id, user_id, storage_path, original_filename, is_public)
VALUES
  ('d0e10000-0000-4000-c000-000000000001', 'd0e10000-0000-4000-a000-000000000001', 'public/john/artwork1.jpg', 'my_first_drawing.jpg', TRUE),
  ('d0e10000-0000-4000-c000-000000000002', 'd0e10000-0000-4000-a000-000000000001', 'public/john/artwork2.jpg', 'landscape_drawing.jpg', TRUE),
  ('d0e10000-0000-4000-c000-000000000003', 'd0e10000-0000-4000-a000-000000000002', 'public/jane/sketch1.jpg', 'sketch_portrait.jpg', TRUE),
  ('d0e10000-0000-4000-c000-000000000004', 'd0e10000-0000-4000-a000-000000000002', 'private/jane/wip.jpg', 'work_in_progress.jpg', FALSE); 