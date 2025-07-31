#!/bin/bash

# LibertyX CI/CD Audit Integration Script
# This script provides a standardized way to run audits in CI/CD environments

set -e

# Default configuration
AUDIT_CONFIG="./audit.config.json"
OUTPUT_PATH="./audit-reports"
FORMAT="both"
PARALLEL="true"
VERBOSE="false"
STOP_ON_ERROR="false"
PHASES=""
EXCLUDE_PHASES=""
FAIL_ON_SCORE=""
FAIL_ON_READINESS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
LibertyX CI/CD Audit Integration Script

Usage: $0 [OPTIONS]

Options:
    -c, --config PATH           Path to audit configuration file (default: ./audit.config.json)
    -o, --output PATH           Output directory for reports (default: ./audit-reports)
    -f, --format FORMAT         Report format: json|html|both (default: both)
    -p, --phases PHASES         Comma-separated list of phases to run
    -e, --exclude-phases PHASES Comma-separated list of phases to exclude
    --no-parallel               Run phases sequentially instead of parallel
    --verbose                   Enable verbose output
    --stop-on-error             Stop execution on first error
    --fail-on-score SCORE       Fail if overall score is below this threshold
    --fail-on-readiness LEVEL   Fail if production readiness is below this level
                                (NOT_READY|NEEDS_WORK|READY|EXCELLENT)
    -h, --help                  Show this help message

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
    $0

    # Run only security and testing phases
    $0 --phases SECURITY,TESTING

    # Run audit and fail if score is below 80
    $0 --fail-on-score 80

    # Run audit and fail if not production ready
    $0 --fail-on-readiness READY

    # Run in verbose mode with custom output
    $0 --verbose --output ./custom-reports

Exit Codes:
    0   Success
    1   Audit failed or critical issues found
    2   Invalid arguments or configuration
    3   Audit execution error
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            AUDIT_CONFIG="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -p|--phases)
            PHASES="$2"
            shift 2
            ;;
        -e|--exclude-phases)
            EXCLUDE_PHASES="$2"
            shift 2
            ;;
        --no-parallel)
            PARALLEL="false"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --stop-on-error)
            STOP_ON_ERROR="true"
            shift
            ;;
        --fail-on-score)
            FAIL_ON_SCORE="$2"
            shift 2
            ;;
        --fail-on-readiness)
            FAIL_ON_READINESS="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 2
            ;;
    esac
done

# Override with environment variables if set
AUDIT_CONFIG="${CI_AUDIT_CONFIG:-$AUDIT_CONFIG}"
OUTPUT_PATH="${CI_AUDIT_OUTPUT:-$OUTPUT_PATH}"
FORMAT="${CI_AUDIT_FORMAT:-$FORMAT}"
PHASES="${CI_AUDIT_PHASES:-$PHASES}"
PARALLEL="${CI_AUDIT_PARALLEL:-$PARALLEL}"
VERBOSE="${CI_AUDIT_VERBOSE:-$VERBOSE}"
STOP_ON_ERROR="${CI_AUDIT_STOP_ON_ERROR:-$STOP_ON_ERROR}"
FAIL_ON_SCORE="${CI_AUDIT_FAIL_ON_SCORE:-$FAIL_ON_SCORE}"
FAIL_ON_READINESS="${CI_AUDIT_FAIL_ON_READINESS:-$FAIL_ON_READINESS}"

# Validate format
if [[ ! "$FORMAT" =~ ^(json|html|both)$ ]]; then
    print_error "Invalid format: $FORMAT. Must be json, html, or both."
    exit 2
fi

# Validate fail-on-readiness if set
if [[ -n "$FAIL_ON_READINESS" ]] && [[ ! "$FAIL_ON_READINESS" =~ ^(NOT_READY|NEEDS_WORK|READY|EXCELLENT)$ ]]; then
    print_error "Invalid readiness level: $FAIL_ON_READINESS. Must be NOT_READY, NEEDS_WORK, READY, or EXCELLENT."
    exit 2
fi

# Print configuration
print_info "Starting LibertyX Audit"
print_info "Configuration:"
print_info "  Config file: $AUDIT_CONFIG"
print_info "  Output path: $OUTPUT_PATH"
print_info "  Format: $FORMAT"
print_info "  Parallel: $PARALLEL"
print_info "  Verbose: $VERBOSE"
print_info "  Stop on error: $STOP_ON_ERROR"
[[ -n "$PHASES" ]] && print_info "  Phases: $PHASES"
[[ -n "$EXCLUDE_PHASES" ]] && print_info "  Exclude phases: $EXCLUDE_PHASES"
[[ -n "$FAIL_ON_SCORE" ]] && print_info "  Fail on score below: $FAIL_ON_SCORE"
[[ -n "$FAIL_ON_READINESS" ]] && print_info "  Fail on readiness below: $FAIL_ON_READINESS"

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 3
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 3
fi

# Check if audit CLI is available
if ! npm list libertyx-audit &> /dev/null; then
    print_warning "libertyx-audit not found in dependencies, attempting to install..."
    npm install --save-dev libertyx-audit || {
        print_error "Failed to install libertyx-audit"
        exit 3
    }
fi

# Create output directory
mkdir -p "$OUTPUT_PATH"

# Build audit command
AUDIT_CMD="npx libertyx-audit run"
AUDIT_CMD="$AUDIT_CMD --config \"$AUDIT_CONFIG\""
AUDIT_CMD="$AUDIT_CMD --output \"$OUTPUT_PATH\""
AUDIT_CMD="$AUDIT_CMD --format $FORMAT"

if [[ "$PARALLEL" == "true" ]]; then
    AUDIT_CMD="$AUDIT_CMD --parallel"
else
    AUDIT_CMD="$AUDIT_CMD --no-parallel"
fi

if [[ "$VERBOSE" == "true" ]]; then
    AUDIT_CMD="$AUDIT_CMD --verbose"
fi

if [[ "$STOP_ON_ERROR" == "true" ]]; then
    AUDIT_CMD="$AUDIT_CMD --stop-on-error"
fi

if [[ -n "$PHASES" ]]; then
    AUDIT_CMD="$AUDIT_CMD --phases \"$PHASES\""
fi

if [[ -n "$EXCLUDE_PHASES" ]]; then
    AUDIT_CMD="$AUDIT_CMD --exclude-phases \"$EXCLUDE_PHASES\""
fi

# Run the audit
print_info "Executing audit command: $AUDIT_CMD"
set +e  # Don't exit on audit failure, we want to process results
eval $AUDIT_CMD
AUDIT_EXIT_CODE=$?
set -e

# Find the latest report file
LATEST_REPORT=$(find "$OUTPUT_PATH" -name "audit-report-*.json" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

if [[ -z "$LATEST_REPORT" ]] || [[ ! -f "$LATEST_REPORT" ]]; then
    print_error "No audit report found in $OUTPUT_PATH"
    exit 3
fi

print_success "Audit report generated: $LATEST_REPORT"

# Parse results using jq if available
if command -v jq &> /dev/null; then
    OVERALL_SCORE=$(jq -r '.overallScore // 0' "$LATEST_REPORT")
    OVERALL_STATUS=$(jq -r '.overallStatus // "unknown"' "$LATEST_REPORT")
    PRODUCTION_READINESS=$(jq -r '.productionReadiness // "UNKNOWN"' "$LATEST_REPORT")
    PHASES_PASSED=$(jq -r '.phasesPassed | length' "$LATEST_REPORT")
    PHASES_TOTAL=$(jq -r '.phasesExecuted | length' "$LATEST_REPORT")
    ERROR_COUNT=$(jq -r '.errors | length' "$LATEST_REPORT")
    
    print_info "Audit Results:"
    print_info "  Overall Score: $OVERALL_SCORE/100"
    print_info "  Overall Status: $OVERALL_STATUS"
    print_info "  Production Readiness: $PRODUCTION_READINESS"
    print_info "  Phases Passed: $PHASES_PASSED/$PHASES_TOTAL"
    print_info "  Errors: $ERROR_COUNT"
    
    # Check fail conditions
    SHOULD_FAIL=false
    
    # Check score threshold
    if [[ -n "$FAIL_ON_SCORE" ]] && [[ "$OVERALL_SCORE" -lt "$FAIL_ON_SCORE" ]]; then
        print_error "Overall score ($OVERALL_SCORE) is below threshold ($FAIL_ON_SCORE)"
        SHOULD_FAIL=true
    fi
    
    # Check readiness threshold
    if [[ -n "$FAIL_ON_READINESS" ]]; then
        case "$FAIL_ON_READINESS" in
            "EXCELLENT")
                if [[ "$PRODUCTION_READINESS" != "EXCELLENT" ]]; then
                    print_error "Production readiness ($PRODUCTION_READINESS) is below threshold ($FAIL_ON_READINESS)"
                    SHOULD_FAIL=true
                fi
                ;;
            "READY")
                if [[ "$PRODUCTION_READINESS" != "EXCELLENT" ]] && [[ "$PRODUCTION_READINESS" != "READY" ]]; then
                    print_error "Production readiness ($PRODUCTION_READINESS) is below threshold ($FAIL_ON_READINESS)"
                    SHOULD_FAIL=true
                fi
                ;;
            "NEEDS_WORK")
                if [[ "$PRODUCTION_READINESS" == "NOT_READY" ]]; then
                    print_error "Production readiness ($PRODUCTION_READINESS) is below threshold ($FAIL_ON_READINESS)"
                    SHOULD_FAIL=true
                fi
                ;;
        esac
    fi
    
    # Check if audit command itself failed
    if [[ $AUDIT_EXIT_CODE -ne 0 ]]; then
        print_error "Audit command failed with exit code $AUDIT_EXIT_CODE"
        SHOULD_FAIL=true
    fi
    
    # Generate summary for CI systems
    if [[ -n "$GITHUB_STEP_SUMMARY" ]]; then
        cat >> "$GITHUB_STEP_SUMMARY" << EOF
## 🔍 Audit Results Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | $OVERALL_SCORE/100 |
| **Status** | $OVERALL_STATUS |
| **Production Readiness** | $PRODUCTION_READINESS |
| **Phases Passed** | $PHASES_PASSED/$PHASES_TOTAL |
| **Errors** | $ERROR_COUNT |

### 📄 Reports Generated
- JSON Report: \`$LATEST_REPORT\`
EOF
        
        # Add HTML report if it exists
        HTML_REPORT="${LATEST_REPORT%.json}.html"
        if [[ -f "$HTML_REPORT" ]]; then
            echo "- HTML Report: \`$HTML_REPORT\`" >> "$GITHUB_STEP_SUMMARY"
        fi
    fi
    
    # Set GitHub Actions outputs if running in GitHub Actions
    if [[ -n "$GITHUB_OUTPUT" ]]; then
        echo "overall_score=$OVERALL_SCORE" >> "$GITHUB_OUTPUT"
        echo "overall_status=$OVERALL_STATUS" >> "$GITHUB_OUTPUT"
        echo "production_readiness=$PRODUCTION_READINESS" >> "$GITHUB_OUTPUT"
        echo "phases_passed=$PHASES_PASSED" >> "$GITHUB_OUTPUT"
        echo "phases_total=$PHASES_TOTAL" >> "$GITHUB_OUTPUT"
        echo "error_count=$ERROR_COUNT" >> "$GITHUB_OUTPUT"
        echo "report_path=$LATEST_REPORT" >> "$GITHUB_OUTPUT"
    fi
    
    if [[ "$SHOULD_FAIL" == "true" ]]; then
        print_error "Audit failed based on specified criteria"
        exit 1
    else
        print_success "Audit completed successfully"
        exit 0
    fi
    
else
    print_warning "jq not available, cannot parse detailed results"
    
    # Basic check - if audit command failed, fail the script
    if [[ $AUDIT_EXIT_CODE -ne 0 ]]; then
        print_error "Audit command failed with exit code $AUDIT_EXIT_CODE"
        exit 1
    else
        print_success "Audit completed"
        exit 0
    fi
fi