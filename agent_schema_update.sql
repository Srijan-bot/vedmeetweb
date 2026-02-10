-- Add new columns to profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'contact_no') THEN
        ALTER TABLE profiles ADD COLUMN contact_no TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agent_name') THEN
        ALTER TABLE profiles ADD COLUMN agent_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employment_code') THEN
        ALTER TABLE profiles ADD COLUMN employment_code TEXT UNIQUE;
    END IF;
END $$;

-- Function to generate unique employment code
CREATE OR REPLACE FUNCTION set_employment_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    exists BOOLEAN;
BEGIN
    -- Only generate for agents and if code is not already set
    IF NEW.role = 'agent' AND NEW.employment_code IS NULL THEN
        LOOP
            -- Generate a random code, e.g., AGT-123456
            new_code := 'AGT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
            
            -- Check if it exists
            SELECT EXISTS(SELECT 1 FROM profiles WHERE employment_code = new_code) INTO exists;
            
            -- If not exists, set it and exit loop
            IF NOT exists THEN
                NEW.employment_code := new_code;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the function before insert or update
DROP TRIGGER IF EXISTS trigger_set_employment_code ON profiles;

CREATE TRIGGER trigger_set_employment_code
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_employment_code();

-- Backfill existing agents if they don't have a code
-- This update will trigger the trigger we just made
UPDATE profiles 
SET role = role 
WHERE role = 'agent' AND employment_code IS NULL;
