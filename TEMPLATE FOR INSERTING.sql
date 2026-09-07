INSERT INTO dbo.character_info (CHARNAME, GENDER, CHARTYPE, ORIGIN, PHOTO_URL, APPERANCE, FIRSTAPPEARED, QUOTE, DESCRIPT)
VALUES ('<Character Name>', '<M/F/O>', '<Superhero/Villain/Supporting/Agent/Vigilante>', '<Origin Planet>', '<URL to photo>', '<Apperance Year>', '<First Apperance>', '<Quote>', '<Desctription>');

-- 2️⃣ Insert species (can add multiple rows if needed)
INSERT INTO dbo.species (CHARNAME, SPECIES)
VALUES 
('<Character Name>', '<Species 1>'),
('<Character Name>', '<Species 2>');  -- optional

-- 3️⃣ Insert powers (can add multiple rows)
INSERT INTO dbo.powers (CHARNAME, POWERS)
VALUES 
('<Character Name>', '<Power 1>'),
('<Character Name>', '<Power 2>'),
('<Character Name>', '<Power 3>');  -- add as many as needed

-- 4️⃣ Insert affiliations (can add multiple rows)
INSERT INTO dbo.affiliations (CHARNAME, AFFILIATIONS)
VALUES
('<Character Name>', '<Affiliation 1>'),
('<Character Name>', '<Affiliation 2>');  -- optional

-- 5️⃣ Insert appearances (can add multiple rows)
INSERT INTO dbo.apperance_types (CHARNAME, APPERANCES)
VALUES
('<Character Name>', '<Comics/Movies/Live-Action Show/Animation>'),
('<Character Name>', '<Other Appearance>');  -- optional