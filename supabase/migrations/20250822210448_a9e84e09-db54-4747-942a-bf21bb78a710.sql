-- Update the existing user to have instructor role so they can access admin panel
UPDATE profiles 
SET role = 'instructor' 
WHERE user_id = 'b7747644-4ead-40bc-a8ae-6459833cc81b';