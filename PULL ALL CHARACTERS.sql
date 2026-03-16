SELECT 
    c.CHARNAME,
    c.PHOTO_URL,
    c.APPERANCE,
    c.GENDER,
    c.CHARTYPE,
    c.ORIGIN,
    c.FIRSTAPPEARED,
    c.QUOTE,
    c.DESCRIPT,
    -- Species
    STUFF((
        SELECT ', ' + s.SPECIES
        FROM dbo.species AS s
        WHERE s.CHARNAME = c.CHARNAME
        FOR XML PATH('')
    ), 1, 2, '') AS Species,
    
    -- Powers
    STUFF((
        SELECT ', ' + p.POWERS
        FROM dbo.powers AS p
        WHERE p.CHARNAME = c.CHARNAME
        FOR XML PATH('')
    ), 1, 2, '') AS Powers,
    
    -- Affiliations
    STUFF((
        SELECT ', ' + a.AFFILIATIONS
        FROM dbo.affiliations AS a
        WHERE a.CHARNAME = c.CHARNAME
        FOR XML PATH('')
    ), 1, 2, '') AS Affiliations,
    
    -- Appearances
    STUFF((
        SELECT ', ' + ap.APPERANCES
        FROM dbo.apperance_types AS ap
        WHERE ap.CHARNAME = c.CHARNAME
        FOR XML PATH('')
    ), 1, 2, '') AS Appearances

FROM dbo.character_info AS c
ORDER BY c.CHARNAME;