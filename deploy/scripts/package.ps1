param(
    [string]$ArchiveName = ('aloogiyah-server-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.tar.gz')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$output = Join-Path $root 'release'
New-Item -ItemType Directory -Force $output | Out-Null
if ([IO.Path]::GetFileName($ArchiveName) -ne $ArchiveName -or !$ArchiveName.EndsWith('.tar.gz')) {
    throw 'ArchiveName must be a file name ending in .tar.gz.'
}
$archive = Join-Path $output $ArchiveName
if (Test-Path -LiteralPath $archive) { throw 'Archive already exists. Choose a new name.' }
& tar -czf $archive --exclude=node_modules --exclude=bin --exclude=obj --exclude=.next --exclude=dist --exclude=out --exclude=.vs --exclude=.idea --exclude=.git --exclude=.tmp --exclude=tests --exclude=coverage --exclude=.env --exclude=.env.local --exclude=.env.production --exclude=.env.development --exclude=.env.test --exclude='.env.*.local' --exclude=appsettings.Development.json --exclude=appsettings.Local.json --exclude=uploads --exclude=Uploads --exclude=ChatFiles --exclude=BusinessDocuments --exclude=AGENTS.md --exclude=CLAUDE.md --exclude=*.tsbuildinfo --exclude=*.log --exclude=*.pfx --exclude=*.p12 --exclude=*.pem --exclude=*.key -C $root compose.yaml .env.example backend frontend admin-panel deploy DEPLOYMENT.md
if ($LASTEXITCODE -ne 0) { throw 'Packaging failed.' }
Write-Output "Server package: $archive"
$hash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText("$archive.sha256", "$hash  $ArchiveName`n", [Text.UTF8Encoding]::new($false))
Write-Output "SHA256: $hash"

