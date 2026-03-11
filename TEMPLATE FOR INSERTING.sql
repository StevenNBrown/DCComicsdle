INSERT INTO dccomicsdle_schema.character_info 
(charname, gender, chartype, origin, photo_url, quotes, description, firstappears, yearappeard)
VALUES 
('Wonder Woman', 'W', 'Superhero', 'Earth', 
'https://static.wikia.nocookie.net/marvel_dc/images/c/cc/Wonder_Woman_Vol_5_4_Textless.jpg/revision/latest?cb=20160810132845', 
'The Lasso of Truth compels you!', 
'Princess in a mans world', 
'All Star Comics #8',
'1942');

INSERT INTO dccomicsdle_schema.species (charname, species)
VALUES 
('Wonder Woman', 'Amazon'),
('Wonder Woman', 'Godling');

INSERT INTO dccomicsdle_schema.powers (charname, powers)
VALUES 
('Wonder Woman', 'Flight'),
('Wonder Woman', 'Super Strength'),
('Wonder Woman', 'Super Speed'),
('Wonder Woman', 'Enhanced Durability'),
('Wonder Woman', 'Immortality');

INSERT INTO dccomicsdle_schema.affiliations (charname, affiliations)
VALUES
('Wonder Woman', 'Justice League'),
('Wonder Woman', 'Justice Society of America') ;

INSERT INTO dccomicsdle_schema.appearance_types (charname, apperances)
VALUES
('Wonder Woman', 'Comics'),
('Wonder Woman', 'Movies'),
('Wonder Woman', 'Animation'),
('Wonder Woman', 'Live-Action Show');

INSERT INTO dccomicsdle_schema.aliases (charname, aliases)
VALUES
('Wonder Woman', 'Diana Prince');