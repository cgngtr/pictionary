-- Seed data for Users table
INSERT INTO users (id, username, first_name, last_name)
VALUES 
  ('69f711c2-6449-4522-be82-59fc30b4fa0a', 'reveck', 'Çağan', 'Uğtur');

-- Seed data for Profiles table
INSERT INTO profiles (id, user_id, description, avatar_url)
VALUES
  ('d0e10000-0000-4000-b000-000000000001', '69f711c2-6449-4522-be82-59fc30b4fa0a', 'hi, im cagan', 'https://i.pinimg.com/736x/d0/a1/e2/d0a1e22d2c0c7590f17eee733597a632.jpg');
