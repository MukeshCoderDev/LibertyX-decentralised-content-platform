# LibertyX CI/CD Audit Integration Script (PowerShell)
# This script provides a standardized way to run audits in CI/CD environments on Windows

param(
    [string]$Config = "./audit.config.json",
    [string]$Output = "./audit-reports",
    [string]$Format = "both",
    [string]$Phases = "",
    [string]$ExcludePhases = "",
    [switch]$NoParallel,
    [switch]$Verbose,
    [switch]$StopOnError,
    [int]$FailOnScore = 0,
    [string]$FailOnReadiness = "",
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Show-Usage {
    @"
LibertyX CI/CD Audit Integration Script (PowerShell)

Usage: .\ci-audit.ps1 [OPTIONS]

Options:
    -Config PATH                Path to audit configuration file (default: ./audit.config.json)
    -Output PATH                Output directory for reports (default: ./audit-reports)
    -Format FORMAT              Report format: json|html|both (default: both)
    -Phases PHASES              Comma-separated list of phases to run
    -ExcludePhases PHASES       Comma-separated list of phases to exclude
    -NoParallel                 Run phases sequentially instead of parallel
    -Verbose                    Enable verbose output
    -StopOnError                Stop execution on first error
    -FailOnScore SCORE          Fail if overall score is below this threshold
    -FailOnReadiness LEVEL      Fail if production readiness is below this level
                                (NOT_READY|NEEDS_WORK|READY|EXCELLENT)
    -Help                       Show this help message

Environment Variables:
    CI_AUDIT_CONFIG             Override config file path
    CI_AUDIT_OUTPUT             Override output directory
    CI_AUDIT_FORMAT             Override report format
    CI_AUDIT_PHASES             Override phases to run
    CI_AUDIT_PARALLEL           Set to 'false' to disable parallel execution
    CI_AUDIT_VERBOSE            Set to 'true' to enable verbose output
    CI_AUDIT_STOP_ON_ERROR      Set to 'true' to stop on first error
    CI_AUDIT_FAIL_ON_SCORE      Fail threshold for overall score
    CI_AUDIT_FAIL_ON_READINESS  Fail threshold for production readiness

Examples:
    # Run full audit with default settings
    .\ci-audit.ps1

    # Run only security and testing phases
    .\ci-audit.ps1 -Phases "SECURITY,TESTING"

    # Run audit and fail if score is below 80
    .\ci-audit.ps1 -FailOnScore 80

    # Run audit and fail if not production ready
    .\ci-audit.ps1 -FailOnReadiness "READY"

Exit Codes:
    0   Success
    1   Audit failed or critical issues found
    2   Invalid arguments or configuration
    3   Audit execution error
"@
}

if ($Help) {
    Show-Usage
    exit 0
}

# Override with environment variables if set
if ($env:CI_AUDIT_CONFIG) { $Config = $env:CI_AUDIT_CONFIG }
if ($env:CI_AUDIT_OUTPUT) { $Output = $env:CI_AUDIT_OUTPUT }
if ($env:CI_AUDIT_FORMAT) { $Format = $env:CI_AUDIT_FORMAT }
if ($env:CI_AUDIT_PHASES) { $Phases = $env:CI_AUDIT_PHASES }
if ($env:CI_AUDIT_PARALLEL -eq 'false') { $NoParallel = $true }
if ($env:CI_AUDIT_VERBOSE -eq 'true') { $Verbose = $true }
if ($env:CI_AUDIT_STOP_ON_ERROR -eq 'true') { $StopOnError = $true }
if ($env:CI_AUDIT_FAIL_ON_SCORE) { $FailOnScore = [int]$env:CI_AUDIT_FAIL_ON_SCORE }
if ($env:CI_AUDIT_FAIL_ON_READINESS) { $FailOnReadiness = $env:CI_AUDIT_FAIL_ON_READINESS }

# Validate format
if ($Format -notmatch '^(json|html|both)$') {
    Write-Error "Invalid format: $Format. Must be json, html, or both."
    exit 2
}

# Validate fail-on-readiness if set
if ($FailOnReadiness -and $FailOnReadiness -notmatch '^(NOT_READY|NEEDS_WORK|READY|EXCELLENT)$') {
    Write-Error "Invalid readiness level: $FailOnReadiness. Must be NOT_READY, NEEDS_WORK, READY, or EXCELLENT."
    exit 2
}

# Print configuration
Write-Info "Starting LibertyX Audit"
Write-Info "Configuration:"
Write-Info "  Config file: $Config"
Write-Info "  Output path: $Output"
Write-Info "  Format: $Format"
Write-Info "  Parallel: $(-not $NoParallel)"
Write-Info "  Verbose: $Verbose"
Write-Info "  Stop on error: $StopOnError"
if ($Phases) { Write-Info "  Phases: $Phases" }
if ($ExcludePhases) { Write-Info "  Exclude phases: $ExcludePhases" }
if ($FailOnScore -gt 0) { Write-Info "  Fail on score below: $FailOnScore" }
if ($FailOnReadiness) { Write-Info "  Fail on readiness below: $FailOnReadiness" }

# Check if Node.js and npm are available
try {
    $null = Get-Command node -ErrorAction Stop
    $null = Get-Command npm -ErrorAction Stop
} catch {
    Write-Error "Node.js or npm is not installed or not in PATH"
    exit 3
}

# Create output directory
if (-not (Test-Path $Output)) {
    New-Item -ItemType Directory -Path $Output -Force | Out-Null
}

# Build audit command
$AuditCmd = @("npx", "libertyx-audit", "run")
$AuditCmd += "--config", $Config
$AuditCmd += "--output", $Output
$AuditCmd += "--format", $Format

if (-not $NoParallel) {
    $AuditCmd += "--parallel"
} else {
    $AuditCmd += "--no-parallel"
}

if ($Verbose) {
    $AuditCmd += "--verbose"
}

if ($StopOnError) {
    $AuditCmd += "--stop-on-error"
}

if ($Phases) {
    $AuditCmd += "--phases", $Phases
}

if ($ExcludePhases) {
    $AuditCmd += "--exclude-phases", $ExcludePhases
}

# Run the audit
Write-Info "Executing audit command: $($AuditCmd -join ' ')"
try {
    & $AuditCmd[0] $AuditCmd[1..($AuditCmd.Length-1)]
    $AuditExitCode = $LASTEXITCODE
} catch {
    Write-Error "Failed to execute audit command: $_"
    exit 3
}

# Find the latest report file
$LatestReport = Get-ChildItem -Path $Output -Filter "audit-report-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $LatestReport) {
    Write-Error "No audit report found in $Output"
    exit 3
}

Write-Success "Audit report generated: $($LatestReport.FullName)"

# Parse results if possible
try {
    $ReportContent = Get-Content $LatestReport.FullName -Raw | ConvertFrom-Json
    
    $OverallScore = $ReportContent.overallScore
    $OverallStatus = $ReportContent.overallStatus
    $ProductionReadiness = $ReportContent.productionReadiness
    $PhasesPassed = $ReportContent.phasesPassed.Count
    $PhasesTotal = $ReportContent.phasesExecuted.Count
    $ErrorCount = $ReportContent.errors.Count
    
    Write-Info "Audit Results:"
    Write-Info "  Overall Score: $OverallScore/100"
    Write-Info "  Overall Status: $OverallStatus"
    Write-Info "  Production Readiness: $ProductionReadiness"
    Write-Info "  Phases Passed: $PhasesPassed/$PhasesTotal"
    Write-Info "  Errors: $ErrorCount"
    
    # Check fail conditions
    $ShouldFail = $false
    
    # Check score threshold
    if ($FailOnScore -gt 0 -and $OverallScore -lt $FailOnScore) {
        Write-Error "Overall score ($OverallScore) is below threshold ($FailOnScore)"
        $ShouldFail = $true
    }
    
    # Check readiness threshold
    if ($FailOnReadiness) {
        $ReadinessLevels = @("NOT_READY", "NEEDS_WORK", "READY", "EXCELLENT")
        $CurrentLevel = $ReadinessLevels.IndexOf($ProductionReadiness)
        $RequiredLevel = $ReadinessLevels.IndexOf($FailOnReadiness)
        
        if ($CurrentLevel -lt $RequiredLevel) {
            Write-Error "Production readiness ($ProductionReadiness) is below threshold ($FailOnReadiness)"
            $ShouldFail = $true
        }
    }
    
    # Check if audit command itself failed
    if ($AuditExitCode -ne 0) {
        Write-Error "Audit command failed with exit code $AuditExitCode"
        $ShouldFail = $true
    }
    
    # Set GitHub Actions outputs if running in GitHub Actions
    if ($env:GITHUB_OUTPUT) {
        Add-Content -Path $env:GITHUB_OUTPUT -Value "overall_score=$OverallScore"
        Add-Content -Path $env:GITHUB_OUTPUT -Value "overall_status=$OverallStatus"
        Add-Content -Path $env:GITHUB_OUTPUT -Value "production_readiness=$ProductionReadiness"
        Add-Content -Path $env:GITHUB_OUTPUT -Value "phases_passed=$PhasesPassed"
        Add-Content -Path $env:GITHUB_OUTPUT -Value "phases_total=$PhasesTotal"
        Add-Content -Path $env:GITHUB_OUTPUT -Value "error_count=$ErrorCount"
        Add-Content -Path $env:GITHUB_OUTPUT -Value "report_path=$($LatestReport.FullName)"
    }
    
    if ($ShouldFail) {
        Write-Error "Audit failed based on specified criteria"
        exit 1
    } else {
        Write-Success "Audit completed successfully"
        exit 0
    }
    
} catch {
    Write-Warning "Could not parse audit results: $_"
    
    # Basic check - if audit command failed, fail the script
    if ($AuditExitCode -ne 0) {
        Write-Error "Audit command failed with exit code $AuditExitCode"
        exit 1
    } else {
        Write-Success "Audit completed"
        exit 0
    }
}