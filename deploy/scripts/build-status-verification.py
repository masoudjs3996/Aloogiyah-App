"""Generate ASCII-only, read-only checks for IDs and stored Persian text."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[2]
normal = (root/'deploy/scripts/normalize-statuses.sql').read_text(encoding='utf-8')
numbering = (root/'deploy/scripts/renumber-statuses.sql').read_text(encoding='utf-8')
ids = {code:(int(kind),int(identifier)) for code,kind,identifier in
       re.findall(r"\('([^']+)',(\d+),(\d+)\)", numbering)}
rows = re.findall(r"\((\d+),(\d+),'([^']+)','([^']+)','([^']+)','([^']+)'\)",normal)
assert len(rows)==len(ids)==27
values = []
for _,kind,_,code,name,description in rows:
    entity_type,identifier = ids[code]
    assert entity_type==int(kind)
    name_hash = hashlib.md5(name.encode('utf-8')).hexdigest()
    description_hash = hashlib.md5(description.encode('utf-8')).hexdigest()
    values.append(f"({identifier},{kind},'{code}','{name_hash}','{description_hash}')")
sql = '''-- Read-only. Hashes verify actual stored UTF-8 text independently of terminal display.
WITH expected(id,kind,code,name_hash,description_hash) AS (VALUES
''' + ',\n'.join(values) + ''')
SELECT (SELECT count(*) FROM public."Statuses") AS "TotalStatuses",
       count(s."StatusId") AS "MatchedIdsAndCodes",
       count(*) FILTER(WHERE md5(s."Name")=e.name_hash) AS "CorrectNames",
       count(*) FILTER(WHERE md5(s."Description")=e.description_hash) AS "CorrectDescriptions"
FROM expected e LEFT JOIN public."Statuses" s
ON s."StatusId"=e.id AND s."EntityStatus"=e.kind AND s."Code"=e.code AND NOT s."IsDeleted";
'''
(root/'release/verify-final-statuses.sql').write_text(sql,encoding='ascii')
print('Created release/verify-final-statuses.sql: 27 expected status records.')
