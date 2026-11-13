-- Coach-facing notes shown alongside the program (e.g. "do these at a
-- controlled tempo") — distinct from `description`, which is the program's
-- summary blurb shown in the programs list.
ALTER TABLE programs ADD COLUMN notes text;
