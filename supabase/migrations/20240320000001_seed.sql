-- First, we need to create some users in auth.users
-- Note: In production, users would be created through sign-up
INSERT INTO auth.users (id, email)
VALUES
    ('d0d4e939-62b4-4fd7-a47f-f3d49725405d', 'user1@example.com'),
    ('c1d8e123-45f6-7a8b-9c0d-ef1234567890', 'user2@example.com');

-- Insert corresponding users into our custom users table
INSERT INTO users (id, username)
VALUES
    ('d0d4e939-62b4-4fd7-a47f-f3d49725405d', 'user1'),
    ('c1d8e123-45f6-7a8b-9c0d-ef1234567890', 'user2');

-- Insert some sample images
INSERT INTO images (id, user_id, storage_path, original_filename, is_public)
VALUES
    (
        'f7c6d5e4-3b2a-1098-7f6e-5d4c3b2a1098',
        'd0d4e939-62b4-4fd7-a47f-f3d49725405d',
        'images/d0d4e939-62b4-4fd7-a47f-f3d49725405d/sample1.jpg',
        'vacation.jpg',
        TRUE
    ),
    (
        'a1b2c3d4-5e6f-7890-abcd-ef1234567890',
        'd0d4e939-62b4-4fd7-a47f-f3d49725405d',
        'images/d0d4e939-62b4-4fd7-a47f-f3d49725405d/sample2.jpg',
        'profile.jpg',
        FALSE
    ),
    (
        'b2c3d4e5-6f7a-8901-bcde-f12345678901',
        'c1d8e123-45f6-7a8b-9c0d-ef1234567890',
        'images/c1d8e123-45f6-7a8b-9c0d-ef1234567890/sample1.jpg',
        'family.jpg',
        TRUE
    ); 