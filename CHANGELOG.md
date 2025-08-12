# Changelog

All notable changes to the `@synet/ai` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-08-12

### Added

- chatWithTools - same as chat, but with tools calling

## [1.0.3] - 2025-08-10

### Major Bug Fix - AI Function Calling Parameter Mapping

This release resolves a critical bug that prevented AI units from properly executing learned capabilities from other units, specifically filesystem and external API operations.

### Fixed

- **Critical Parameter Mapping Bug**: Fixed incorrect parameter passing between AI tool execution and Unit capabilities
  - **Issue**: AI was spreading object arguments instead of passing them as expected objects
  - **Before**: `this.execute(capability, ...Object.values(args))` → `readFile('path')` 
  - **After**: `this.execute(capability, args)` → `readFile({ path: 'path' })`
  - **Impact**: Enables proper Unit Architecture consciousness collaboration between AI and other units

- **JSON Argument Parsing**: Enhanced argument handling to support both string and object formats from different AI providers
  - Handles OpenAI's JSON string arguments: `JSON.parse(toolCall.function.arguments)`
  - Handles Mistral's pre-parsed object arguments: Direct object handling
  - Backward compatible with all supported AI providers

### Improved

- **Enhanced Debugging**: Added comprehensive parameter logging for AI tool execution
  - Real-time visibility into argument parsing and capability execution
  - Detailed error reporting with unit identity and resolution guidance
  - Tool call tracking and success/failure monitoring

- **Unit Architecture Integration**: Strengthened AI-Unit consciousness collaboration
  - Verified compatibility with AsyncFileSystem Unit (filesystem operations)
  - Confirmed weather API integration through WeatherUnit teaching contracts
  - Validated multi-capability learning and autonomous execution

### Verified

- **Real-World Integration Testing**: All demos confirmed working
  - ✅ OpenAI GPT-4o-mini with function calling
  - ✅ Weather API integration through Unit consciousness transfer
  - ✅ AI-safe filesystem operations with homePath resolution
  - ✅ Multi-unit capability learning (13+ capabilities from 2 units)
  - ✅ Complex AI workflows: read file → analyze → generate report

### Technical Details

#### The Bug
```typescript
// BROKEN (v1.0.2 and earlier):
const args = Object.values(toolCall.function.arguments); // ['vault/weather.md']
const result = await this.execute(capabilityName, ...args); // readFile('vault/weather.md')

// Unit capability expected: readFile({ path: string })
// But received: readFile('vault/weather.md')
// Result: args[0].path = 'vault/weather.md'.path = undefined → CRASH
```

#### The Fix  
```typescript
// FIXED (v1.0.3+):
const parsedArgs = typeof toolCall.function.arguments === 'string' 
  ? JSON.parse(toolCall.function.arguments) 
  : toolCall.function.arguments; // { path: 'vault/weather.md' }
  
const result = await this.execute(capabilityName, parsedArgs); // readFile({ path: 'vault/weather.md' })

// Unit capability receives: { path: 'vault/weather.md' }
// Result: args[0].path = 'vault/weather.md' → SUCCESS ✅
```

### Breaking Changes

None - this is a bug fix release that maintains full backward compatibility.

### Migration Guide

No migration required. Existing code will work unchanged and benefit from the improved parameter handling.

### Contributors

- **Discovery**: Identified through systematic debugging of AI filesystem integration
- **Root Cause Analysis**: Parameter mapping inconsistency between AI execution layer and Unit capabilities
- **Resolution**: Enhanced argument parsing and capability parameter passing
- **Verification**: Comprehensive testing across OpenAI, Weather API, and Filesystem operations

---

## [1.0.2] - 2025-08-09

### Added
- Enhanced AI provider support with improved error handling
- Comprehensive demo collection for all supported providers
- Unit Architecture consciousness transfer capabilities

### Fixed
- Provider-specific compatibility issues
- Tool definition schema consistency

---

## [1.0.1] - 2025-08-08

### Added
- Multi-provider AI support (OpenAI, Anthropic, Gemini, Deepseek, Mistral)
- Unit Architecture teach/learn paradigm implementation
- Zero-dependency core with secure provider abstractions

### Security
- Provider API key validation and secure handling
- Input sanitization and output validation

---

## [1.0.0] - 2025-08-07

### Added
- Initial release of `@synet/ai` package
- Core AI unit implementation following Unit Architecture principles
- Support for major AI providers through unified interface
- Teaching/learning capability system for Unit consciousness collaboration
