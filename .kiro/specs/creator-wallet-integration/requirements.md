# Requirements Document

## Introduction

This feature enables creators to use their own Arweave wallets to pay for video uploads, removing the dependency on a single hardcoded wallet. Since this is an open-source project, creators need to provide their own funding for Arweave storage costs while maintaining a seamless upload experience.

## Requirements

### Requirement 1

**User Story:** As a creator, I want to upload my own Arweave wallet file so that I can pay for my video uploads using my own funds.

#### Acceptance Criteria

1. WHEN a creator accesses the upload page THEN the system SHALL display a wallet upload section before allowing video upload
2. WHEN a creator uploads an Arweave wallet JSON file THEN the system SHALL validate the wallet format
3. WHEN the wallet file is invalid THEN the system SHALL display a clear error message with instructions
4. WHEN the wallet file is valid THEN the system SHALL store it securely for the upload session
5. WHEN the creator completes their upload session THEN the system SHALL clear the wallet data for security

### Requirement 2

**User Story:** As a creator, I want to see my wallet balance and estimated upload costs so that I know if I have sufficient funds before uploading.

#### Acceptance Criteria

1. WHEN a valid wallet is loaded THEN the system SHALL display the wallet's AR balance
2. WHEN a video file is selected THEN the system SHALL estimate and display the Arweave upload cost
3. WHEN the wallet balance is insufficient THEN the system SHALL prevent upload and show funding instructions
4. WHEN the balance is sufficient THEN the system SHALL allow the creator to proceed with upload

### Requirement 3

**User Story:** As a creator, I want clear instructions on how to obtain and fund an Arweave wallet so that I can successfully upload content.

#### Acceptance Criteria

1. WHEN a creator has no wallet uploaded THEN the system SHALL display wallet setup instructions
2. WHEN a creator clicks "How to get an Arweave wallet" THEN the system SHALL show step-by-step guidance
3. WHEN a creator needs to fund their wallet THEN the system SHALL provide funding options and links
4. WHEN a creator encounters wallet issues THEN the system SHALL provide troubleshooting help

### Requirement 4

**User Story:** As a creator, I want my wallet information to be handled securely so that my private keys are protected.

#### Acceptance Criteria

1. WHEN a wallet file is uploaded THEN the system SHALL only store it in browser memory (not localStorage)
2. WHEN the browser tab is closed THEN the system SHALL automatically clear all wallet data
3. WHEN an upload fails THEN the system SHALL maintain wallet data for retry attempts
4. WHEN the creator logs out THEN the system SHALL immediately clear wallet data
5. WHEN displaying wallet info THEN the system SHALL only show the public address, never private keys

### Requirement 5

**User Story:** As a creator, I want to reuse my wallet for multiple uploads in the same session so that I don't have to re-upload it every time.

#### Acceptance Criteria

1. WHEN a wallet is successfully loaded THEN the system SHALL remember it for the current session
2. WHEN a creator uploads multiple videos THEN the system SHALL reuse the same wallet automatically
3. WHEN a creator wants to change wallets THEN the system SHALL provide a "Change Wallet" option
4. WHEN the session expires THEN the system SHALL require wallet re-upload for security