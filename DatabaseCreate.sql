-- ==========================================================================================================================
-- Create Schema Template for Azure SQL Database, Azure Synapse Analytics Database, and Azure Synapse SQL Analytics on-demand
-- ==========================================================================================================================
CREATE SCHEMA dccomicsdle_schema
AUTHORIZATION dbo
GO

CREATE TABLE character_info(
	CHARNAME VARCHAR(50) PRIMARY KEY,
	GENDER CHAR(1) NOT NULL,
	CHARTYPE VARCHAR(50) CHECK (CHARTYPE IN ('Superhero', 'Vilain', 'Supporting', 'Agent', 'Vigilante')),
	ORIGIN VARCHAR(100)  CHECK (ORIGIN IN (
'Earth',
'Krypton',
'Mars',
'Apokolips',
'New Genesis',
'Oa',
'Thanagar',
'Rann',
'Gemworld',
'Zan/Thaal',
'Tamaran',
'Hell',
'Otherworldly'
))
)
GO

CREATE TABLE species(
	CHARNAME VARCHAR(50) NOT NULL,
	SPECIES VARCHAR(100) CHECK (SPECIES IN (
'Human',
'Metahuman',
'Kryptonian',
'Atlantean',
'Amazon',
'Martian',
'New God',
'Demon',
'God',
'Alien',
'Elemental',
'Robot/Android',
'Wizard',
'Cyborg',
'Godling',
'Cosmic Entity'
))

	FOREIGN KEY (CHARNAME) REFERENCES character_info(CHARNAME),
	PRIMARY KEY(CHARNAME, SPECIES)
)
GO

CREATE TABLE powers(
	CHARNAME VARCHAR(50) NOT NULL,
	POWERS VARCHAR(100) CHECK (POWERS IN (
'None',
'Super Strength',
'Super Speed',
'Flight',
'Enhanced Durability',
'Enhanced Agility',
'Enhanced Intelligence',
'Martial Arts',
'Magic',
'Technology',
'Telepathy',
'Telekinesis',
'Energy Projection',
'Shapeshifting',
'Invisibility',
'Regeneration',
'Immortality',
'Size Changing',
'Heat Vision',
'X-Ray Vision',
'Super Hearing',
'Cryokinesis',
'Pyrokinesis',
'Electrokinesis',
'Force Field Generation',
'Illusion Casting',
'Mind Control',
'Time Manipulation',
'Teleportation',
'Dimensional Travel',
'Energy Absorption',
'Animal Communication',
'Speed Force',
'Emotional Spectrum',
'The Green',
'The Red',
'The Grey',
'The Clear',
'The Rot',
'Cosmic Energy'
))
	FOREIGN KEY (CHARNAME) REFERENCES character_info(CHARNAME),
	PRIMARY KEY(CHARNAME, POWERS)
)
GO
	
	

CREATE TABLE affiliations(
	CHARNAME VARCHAR(50) NOT NULL,
	AFFILIATIONS VARCHAR(100) CHECK (AFFILIATIONS IN (
'Justice League',
'Justice League Dark',
'Teen Titans',
'Titans',
'Young Justice',
'Justice Society of America',
'Outsiders',
'Bat Family',
'Birds of Prey',
'Suicide Squad',
'Checkmate',
'Legion of Doom',
'Injustice League',
'Crime Syndicate',
'Green Lantern Corps',
'Sinestro Corps',
'Red Lantern Corps',
'Blue Lantern Corps',
'Violet Lantern Corps',
'Justice League International',
'Watchmen',
'Daily Planet',
'Wayne Enterprises',
'White Lantern Corps',
'Black Lantern Corps',
'LexCorp',
'None'
))
	FOREIGN KEY (CHARNAME) REFERENCES character_info(CHARNAME),
	PRIMARY KEY(CHARNAME, AFFILIATIONS)
)
GO

CREATE TABLE apperance_types(
	CHARNAME VARCHAR(50) NOT NULL,
	APPERANCES VARCHAR(100) CHECK (APPERANCES IN (
'Comics',
'Movies',
'Live-Action Show',
'Animation'))
	FOREIGN KEY (CHARNAME) REFERENCES character_info(CHARNAME),
	PRIMARY KEY(CHARNAME, APPERANCES)
)