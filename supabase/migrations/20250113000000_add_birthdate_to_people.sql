-- Add birthdate field to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS birthdate DATE;

