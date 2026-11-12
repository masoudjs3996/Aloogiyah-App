"""Combine reviewed normalization and ID remapping into one transaction."""
from pathlib import Path

root = Path(__file__).resolve().parents[2]
normal = (root / 'deploy/scripts/normalize-statuses.sql').read_text(encoding='utf-8')
normal = normal.split('-- Last statement deliberately returns a result grid in pgAdmin.')[0]
assert normal.count('COMMIT;') == 1
normal = normal.replace('COMMIT;', '')
renumber = (root / 'deploy/scripts/renumber-statuses.sql').read_text(encoding='utf-8')
output = root / 'release/finalize-statuses.sql'
output.parent.mkdir(exist_ok=True)
output.write_text(normal + '\n' + renumber + '''
COMMIT;
SELECT "StatusId","Code","Name","EntityStatus","Description"
FROM public."Statuses" ORDER BY "EntityStatus","StatusId";
''', encoding='utf-8')
print(output)
