SELECT 
    c.charname,
    c.photo_url,
    c.gender,
    c.chartype,
    c.origin,
    c.firstappears,   
    c.quotes,           
    c.description,
    
    -- Species
    (SELECT STRING_AGG(s.species, ', ')
     FROM dccomicsdle_schema.species s
     WHERE s.charname = c.charname
    ) AS species,
    
    -- Powers
    (SELECT STRING_AGG(p.powers, ', ')
     FROM dccomicsdle_schema.powers p
     WHERE p.charname = c.charname
    ) AS powers,
    
    -- Affiliations
    (SELECT STRING_AGG(a.affiliations, ', ')
     FROM dccomicsdle_schema.affiliations a
     WHERE a.charname = c.charname
    ) AS affiliations,
    
    -- Appearances
    (SELECT STRING_AGG(ap.apperances, ', ')  
     FROM dccomicsdle_schema.appearance_types ap
     WHERE ap.charname = c.charname
    ) AS appearences,
  
   (SELECT STRING_AGG(al.aliases, ', ')  
     FROM dccomicsdle_schema.aliases al
     WHERE al.charname = c.charname
    ) AS aliases

FROM dccomicsdle_schema.character_info c
ORDER BY c.charname;
