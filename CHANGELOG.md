# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.5] - 2025-01-24

### Added

- `--debug` flag for detailed error stack traces
- Message argument now accepts multiple words for improved input flexibility

### Changed

- Enhanced error handling with graceful error suppression and better error reporting

## [0.8.4] - 2025-01-12

### Added

- `providerOptions` support for provider-specific configurations
- Custom HTTP `headers` support for enhanced API request flexibility
- Improved interactive mode handling for message input with better TTY experience

## [0.8.3] - 2025-01-11

### Added

- Shell context information with usage guidance
- Spinner animation replacing text loading messages for improved UX
- Loading indicators for agent tool execution

### Fixed

- Interactive mode and spinner behavior for TTY environments

### Changed

- Windows command execution now uses PowerShell with UTF-8 encoding

## [0.8.2] - 2025-01-10

### Added

- Enhanced shell information and command execution for Windows
- UTF-8 code page on Windows to prevent encoding issues

### Fixed

- npm badge in README for accurate version display
