"""Build an offline, additive PostgreSQL import from the pinned 1404 dataset."""
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'deploy/data/iran-1404'
REVISION = '68687cf96cc1852d5d38c7283353c80829331758'
TABLES = {1: ('Provinces', 'ProvinceId', None),
          2: ('Countys', 'CountyId', 'ProvinceId'),
          5: ('Citys', 'CityId', 'CountyId'),
          6: ('Villages', 'VillageId', 'CountyId')}

def norm(value):
    return re.sub(r'\s+', ' ', value.translate(str.maketrans('يك', 'یک')).replace('\u200c', ' ')).strip()

def quote(value):
    return 'NULL' if value is None else "'" + str(value).replace("'", "''") + "'"

def build():
    raw = (DATA / 'iran.csv').read_bytes()
    rows = list(csv.DictReader(raw.decode('utf-8-sig').splitlines()))
    meta = json.loads((DATA / 'metadata.json').read_text(encoding='utf-8-sig'))
    nodes = {int(r['Id']): r for r in rows}
    assert len(nodes) == len(rows) == meta['total']
    counts = Counter(int(r['DivisionType']) for r in rows)
    expected = {0: 1, 1: 31, 2: 484, 3: 1193, 4: 2777, 5: 1481, 6: 99317, 7: 191}
    assert counts == expected, counts
    for r in rows:
        r['id'] = int(r['Id'])
        r['type'] = int(r['DivisionType'])
        r['parent'] = int(r['ParentCountryDivisionId']) if r['ParentCountryDivisionId'] else None
        assert r['Name'] and len(r['Name']) <= 255
        if r['parent'] is not None:
            assert r['parent'] in nodes
    allowed_parents = {1:0, 2:1, 3:2, 4:3, 5:3, 6:4, 7:5}
    for r in rows:
        if r['type']:
            assert nodes[r['parent']]['type'] == allowed_parents[r['type']]
        seen = set()
        ancestor = r
        r['province'] = r['county'] = None
        while ancestor is not None:
            assert ancestor['id'] not in seen
            seen.add(ancestor['id'])
            if ancestor['type'] == 1:
                r['province'] = ancestor['id']
            if ancestor['type'] == 2:
                r['county'] = ancestor['id']
            ancestor = nodes.get(ancestor['parent'])

    selected = [r for r in rows if r['type'] in TABLES]
    def parent(r):
        return None if r['type'] == 1 else r['province'] if r['type'] == 2 else r['county']
    groups = Counter((r['type'], parent(r), norm(r['Name'])) for r in selected)
    codes = set()
    disambiguated = Counter()
    for r in selected:
        key = (r['type'], parent(r), norm(r['Name']))
        r['app_name'] = r['Name']
        if groups[key] > 1:
            # Keep each settlement separately; full original name/path stays in Nodes.
            r['app_name'] += ' [' + r['Code'] + ':' + str(r['id']) + ']'
            disambiguated[r['type']] += 1
        r['app_code'] = hashlib.sha256(('aloogiyah:iran:1404:' + str(r['id'])).encode()).hexdigest()[:10].upper()
        assert len(r['app_name']) <= 255
        assert r['app_code'] not in codes
        codes.add(r['app_code'])
    assert len({(r['type'], parent(r), norm(r['app_name'])) for r in selected}) == len(selected)

    out = ['-- Generated offline import; upstream MIT license: deploy/data/iran-1404/LICENSE',
           '-- Source revision: ' + REVISION,
           '-- Additive: no existing locations, addresses, farms or users are deleted.',
           'BEGIN;', "SET LOCAL lock_timeout = '10s';",
           'CREATE SCHEMA IF NOT EXISTS iran_geo;',
           '''CREATE TABLE IF NOT EXISTS iran_geo."Nodes" (
               year integer NOT NULL, id integer NOT NULL, parent_id integer,
               name text NOT NULL, official_code text NOT NULL, kind integer NOT NULL,
               province_id integer, county_id integer,
               PRIMARY KEY (year,id));''',
           '''CREATE TABLE IF NOT EXISTS iran_geo."ApplicationMap" (
               year integer NOT NULL, source_id integer NOT NULL, kind integer NOT NULL,
               app_id integer NOT NULL, app_code varchar(10) NOT NULL,
               PRIMARY KEY(year,source_id), UNIQUE(year,kind,app_id),
               FOREIGN KEY(year,source_id) REFERENCES iran_geo."Nodes"(year,id));''',
           '''CREATE OR REPLACE FUNCTION iran_geo.normal_name(value text) RETURNS text
               LANGUAGE sql IMMUTABLE STRICT AS $n$
               SELECT btrim(regexp_replace(replace(translate(value,'يك','یک'),chr(8204),' '),'\\s+',' ','g'))
               $n$;''',
           'LOCK TABLE public."Provinces", public."Countys", public."Citys", public."Villages" IN SHARE ROW EXCLUSIVE MODE;']
    for offset in range(0, len(rows), 1000):
        batch = rows[offset:offset+1000]
        values = []
        for r in batch:
            values.append('(' + ','.join('NULL' if v is None else str(v) if isinstance(v,int) else quote(v)
                           for v in (1404,r['id'],r['parent'],r['Name'],r['Code'],r['type'],r['province'],r['county'])) + ')')
        out.append('INSERT INTO iran_geo."Nodes" VALUES\n' + ',\n'.join(values) +
                   '\nON CONFLICT(year,id) DO NOTHING;')
    out += ['''CREATE TEMP TABLE geo_import_plan (
        source_id integer PRIMARY KEY, kind integer NOT NULL, parent_source integer,
        app_name text NOT NULL, proposed_code varchar(10) NOT NULL UNIQUE
    ) ON COMMIT DROP;''']
    for offset in range(0, len(selected), 1000):
        values = ['(' + ','.join(quote(v) if isinstance(v,str) else 'NULL' if v is None else str(v)
                   for v in (r['id'],r['type'],parent(r),r['app_name'],r['app_code'])) + ')' for r in selected[offset:offset+1000]]
        out.append('INSERT INTO geo_import_plan VALUES\n' + ',\n'.join(values) + ';')
    out.append('''DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM public."Statuses"
            WHERE "Code"='A9ED0F97E4' AND "EntityStatus"=6 AND NOT "IsDeleted") THEN
            RAISE EXCEPTION 'Valid active location status is missing';
        END IF;
    END $$;''')
    out.append('ANALYZE geo_import_plan;')
    for kind, (table, pk, fk) in TABLES.items():
        qualified = 'public."' + table + '"'
        index_fields = (f'"{fk}",' if fk else '') + 'iran_geo.normal_name("Name")'
        out.append(f'''CREATE INDEX IF NOT EXISTS "IX_IranGeo_{table}_Name"
            ON {qualified} ({index_fields});
            ANALYZE {qualified};
            ANALYZE iran_geo."ApplicationMap";''')
        parent_join = '' if fk is None else 'JOIN iran_geo."ApplicationMap" parent ON parent.year=1404 AND parent.source_id=p.parent_source'
        match = 'iran_geo.normal_name(t."Name")=iran_geo.normal_name(p.app_name)'
        if fk:
            match += ' AND t."' + fk + '"=parent.app_id'
        # Never silently match multiple local records or resurrect deleted locations.
        out.append(f'''DO $$ BEGIN
            IF EXISTS (SELECT p.source_id FROM geo_import_plan p {parent_join}
                JOIN {qualified} t ON {match} WHERE p.kind={kind}
                GROUP BY p.source_id HAVING count(*)>1 OR bool_or(t."IsDeleted")) THEN
                RAISE EXCEPTION 'Ambiguous/deleted local location in {table}; resolve before import';
            END IF;
        END $$;''')
        out.append(f'''INSERT INTO iran_geo."ApplicationMap"
            SELECT 1404,p.source_id,p.kind,t."{pk}",t."Code"
            FROM geo_import_plan p {parent_join} JOIN {qualified} t ON {match}
            WHERE p.kind={kind} ON CONFLICT(year,source_id) DO NOTHING;''')
        # A source mapping must still refer to exactly the mapped local record.
        out.append(f'''DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                LEFT JOIN {qualified} t ON t."{pk}"=m.app_id AND t."Code"=m.app_code
                WHERE m.year=1404 AND m.kind={kind} AND t."{pk}" IS NULL) THEN
                RAISE EXCEPTION 'Stale location mapping in {table}';
            END IF;
        END $$;''')
        out.append(f'''DO $$ DECLARE seq regclass;
            previous_value bigint; BEGIN
            seq := pg_get_serial_sequence('{qualified}','{pk}');
            IF seq IS NULL THEN RAISE EXCEPTION 'Missing identity sequence in {table}'; END IF;
            EXECUTE format('SELECT last_value FROM %s',seq) INTO previous_value;
            PERFORM setval(seq,GREATEST(previous_value,
                COALESCE((SELECT max("{pk}") FROM {qualified}),1)),true);
        END $$;''')
        cols = '"Name","Code","StatusId","CreatedAt","IsDeleted"' + (',"' + fk + '"' if fk else '')
        vals = "p.app_name,p.proposed_code,s.\"StatusId\",CURRENT_TIMESTAMP,false" + (',parent.app_id' if fk else '')
        out.append(f'''INSERT INTO {qualified} ({cols}) SELECT {vals}
            FROM geo_import_plan p {parent_join}
            CROSS JOIN public."Statuses" s
            WHERE p.kind={kind} AND s."Code"='A9ED0F97E4' AND NOT s."IsDeleted"
              AND NOT EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m
                             WHERE m.year=1404 AND m.source_id=p.source_id);''')
        out.append(f'''INSERT INTO iran_geo."ApplicationMap"
            SELECT 1404,p.source_id,p.kind,t."{pk}",t."Code"
            FROM geo_import_plan p JOIN {qualified} t ON t."Code"=p.proposed_code
            WHERE p.kind={kind} ON CONFLICT(year,source_id) DO NOTHING;''')
    out.append('''DO $$ BEGIN
        IF (SELECT count(*) FROM iran_geo."Nodes" WHERE year=1404) <> 105475
            OR (SELECT count(*) FROM iran_geo."ApplicationMap" WHERE year=1404) <> 101313 THEN
            RAISE EXCEPTION 'Incomplete geography import; transaction aborted';
        END IF;
    END $$;
    COMMIT;
    SELECT n.kind AS "Type",count(*) AS "SourceCount",count(m.app_id) AS "ApplicationCount"
    FROM iran_geo."Nodes" n LEFT JOIN iran_geo."ApplicationMap" m
      ON m.year=n.year AND m.source_id=n.id
    WHERE n.year=1404 GROUP BY n.kind ORDER BY n.kind;''')
    output = ROOT / 'release/import-iran-locations-1404.sql'
    output.parent.mkdir(exist_ok=True)
    output.write_text('\n\n'.join(out),encoding='utf-8')
    report = {'source': 'https://github.com/Hameds/IranCountryDivisions', 'revision': REVISION,
              'source_year':1404, 'source_sha256':hashlib.sha256(raw).hexdigest(),
              'counts':dict(counts), 'application_records':len(selected),
              'disambiguated_names':dict(disambiguated),
              'sql_sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    (DATA/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=True))

if __name__ == '__main__':
    build()
