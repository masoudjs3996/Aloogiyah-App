import datetime
import getpass
import json
import os
from pathlib import Path
import re
import subprocess

root = Path.home() / "aloogiyah"
os.chdir(root)
username = input("Melipayamak username: ").strip()
if not re.fullmatch(r"[0-9]+", username):
    raise SystemExit("Invalid username.")
key = getpass.getpass("Paste APIKey used as password (hidden): ").strip()
if not re.fullmatch(r"[A-Za-z0-9_-]+", key):
    raise SystemExit("Invalid APIKey format.")
updates = {"PHONE_OTP_ENABLED": "true", "MELIPAYAMAK_API_KEY": key, "MELIPAYAMAK_USERNAME": username, "MELIPAYAMAK_BODY_ID": "577303"}
p = root / ".env"
original = p.read_text()
lines = original.splitlines()
result = []
for line in lines:
    match = re.match(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
    if not match or match.group(1) not in updates:
        result.append(line)
result.extend(name + "=" + value for name, value in updates.items())
backup = Path.home() / "backups" / ("env-before-sms-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f"))
backup.parent.mkdir(exist_ok=True)
with os.fdopen(os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as f:
    f.write(original)
p.write_text("\n".join(result) + "\n")
p.chmod(0o600)
# Capture config internally: never print secrets or subprocess error output containing them.
check = subprocess.run(["sudo", "docker", "compose", "config", "--format", "json"], capture_output=True, text=True)
if check.returncode:
    p.write_text(original)
    raise SystemExit("Compose validation failed. Original .env restored; no service changed.")
settings = json.loads(check.stdout)["services"]["api"]["environment"]
if settings.get("Sms__Melipayamak__Username") != username or settings.get("Sms__Melipayamak__ApiKey") != key or str(settings.get("Sms__Melipayamak__BodyId")) != "577303":
    p.write_text(original)
    raise SystemExit("Compose values do not match. Original .env restored; no service changed.")
subprocess.run(["sudo", "docker", "compose", "up", "-d", "--no-build", "--pull", "never", "--no-deps", "--force-recreate", "api"], check=True)
inspection = subprocess.run(["sudo", "docker", "inspect", "aloogiyah-api-1"], capture_output=True, text=True, check=True)
env = dict(item.split("=", 1) for item in json.loads(inspection.stdout)[0]["Config"]["Env"])
if env.get("Sms__Melipayamak__Username") != username or env.get("Sms__Melipayamak__ApiKey") != key or env.get("Sms__Melipayamak__BodyId") != "577303" or env.get("Auth__PhoneOtpEnabled", "").lower() != "true":
    raise SystemExit("Running container configuration mismatch.")
print("verified: entered key = compose key = running container key")
print("verified: bodyId=577303; phone OTP enabled")
print("No SMS sent by this script. Backup: " + str(backup))

